import type {BucketData, ChatData, MessageData} from './Chat';
import type {BaseData} from './Root';

const parser = new DOMParser();
const getInner = (d:HTMLElement | null ) => d?.innerHTML.trim() || "";

export type HTMLChatData = {
    id: string;
    from: string;
    userName: string;
    count: number;
    messages: MessageData[];
}

function getChat(dom:Document, id:string): HTMLChatData {
    const messages: MessageData[] = []
    let from :string =  getInner(dom.querySelector('.page_header .text.bold'));
    let forwarded : string;

    dom.querySelectorAll('.message').forEach(msg => {
        let text;
        let voice;
        let forwarded;
        let from;

        if (!msg || msg.classList.contains('service')) {
            return;
        }
        from = getInner(msg.querySelector('.body > .from_name'))
        try { text = getInner(msg.querySelector('.text')) } catch (e) { }
        try {
            const v = msg.querySelector('.media_voice_message');
            if (!v)  throw new Error();
            voice = {
                url: v?.getAttribute('href') || "",
                length: getInner(v?.querySelector('.status.details')),
            }
        } catch (e) {}
        try {
            let _from = '';
            const f = msg.querySelector('.forwarded.body')
            if (!f) throw new Error();
            try { _from = getInner(f?.querySelector('.from_name'))} catch (e) { }
            forwarded = {
                from: _from.split('<')[0],
                date: f.querySelector('.date.details')?.getAttribute('title') || ""
            }
        } catch (e) { }

        const message = {
            text,
            from,
            voice,
            forwarded,
            joined: false,
            date: msg.querySelector('.date.details')?.getAttribute('title') || "",
            id: msg.id
        }

        messages.push(message)
    })

    return {
        id,
        messages,
        count: messages.length,
        from,
        userName: from
    }
}

function getData(dom: Document): BaseData {
    return {
        name: getInner(dom.querySelector('.personal_info .names .row .value')),
        phone: getInner(dom.querySelector('.personal_info .info .row .value')),
        chats: Array(parseInt(getInner(dom.querySelector('.section.block_link.chats .counter')))),
        contacts: Array(parseInt(getInner(dom.querySelector('.section.block_link.frequent .counter')))),
    }
}

export function html2json(html: string, path: string) {
    const dom = parser.parseFromString(html, 'text/html')
    if (!path) return null;
    switch (true) {
        case !!path.match(/chat_[0-9]+/):
            const id = path.match(/chat_[0-9]+/)[0]
            return getChat(dom, id)
        case !!path.match(/export_result/):
            return getData(dom)
        default:
            console.error(`unhandled path: ${path}`)
            throw new Error();
    }
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const prettyDate = (date:string) => {
    const parts = date.split('.')
    return [parts[0].replace(/^0/, ''), months[parseInt(parts[1], 10) - 1], parts[2]].join(' ')
}


const new_bucket = () => {
    const bucket : BucketData = {
        messages: [],
        start: '',
        id: 0
    }
    return bucket;
}

function  html2chat (chat: HTMLChatData): ChatData {
    let last;

    const {messages, ...chatData} = chat
    const buckets :BucketData[]= []

    let bucket = new_bucket()
    let service = 0
    for (let m of messages) {
        if (!m) continue
        const joined = !last ? false
                     : last.from !== m.from ? false
                     : last.date !== m.date ? false
                     : true
        if (!last || last.date.split(' ')[0] !== m.date.split(' ')[0]) {
            if (bucket.messages.length) {
                buckets.push(bucket)
                bucket = new_bucket()
            }
            bucket.start = prettyDate(m.date.split(' ')[0])
            bucket.id = service++
        }

        bucket.messages.push({ ...m, joined })
        last = m;
    }

    return {
            ...chatData,
            count: messages.length,
            chatType: "private",
            buckets,
            }
}

interface FilePromises {
    chats: Promise<HTMLChatData>[],
    data: Promise<BaseData>
}

export const files2json = (files: File[]) => {
    const promises : FilePromises = {
        chats: [],
        data: new Promise(accept => accept({
            name: 'unknown',
            phone: 'unknown',
            contacts: [],
            chats: []
        }))
    }

    for (let file of files) {
        const promise : Promise<BaseData | HTMLChatData>= new Promise((accept, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                const r = e?.target?.result?.toString();
                if (!r) return;
                const json = html2json(r, file.webkitRelativePath)
                if (!json) return reject()
                accept(json)
            })
            reader.readAsText(file)
        })
        switch (true) {
            case !!file.name.match(/messages[0-9]*.html/):
                promises.chats.push(promise)
                break;
            case !!file.name.match(/export_results.html/):
                promises.data.then(() => promise)
                break;
        }
    }

    return promises.data
                   .then(data => Promise.all(promises.chats)
                                        .then(chats => ({
                                            ...data,
                                            chats: chats.reduce((a: Record<string, HTMLChatData>, c: HTMLChatData) => {
                                                a[c.id] = {
                                                    ...c,
                                                    messages: c.messages.concat(a[c.id]?.messages)
                                                }
                                                return a
                                            }, {})
                                        }))
                   ).then(info => {
                       const chats : Record<string, ChatData> = {}
                       for (let k of Object.keys(info.chats)) {
                           chats[k] = html2chat(info.chats[k])
                       }
                       return {...info, chats}
                   })
}
