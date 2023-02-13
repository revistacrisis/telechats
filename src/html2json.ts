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
    jumps?: Record<number, number>;
}

function getChat(dom:Document, cid:string): HTMLChatData {
    const messages: MessageData[] = []
    let from :string =  getInner(dom.querySelector('.page_header .text.bold'));
    let forwarded : string;
    let last_id : number = 0;
    let jumps: Record<number, number> = {};

    dom.querySelectorAll('.message').forEach(msg => {
        let text;
        let voice;
        let forwarded;
        let from;
        const id = parseInt(msg.id.replace(/message-?/, ''));

        if (!msg || msg.classList.contains('service')) {
            return;
        }

        if ( id !== last_id + 1) {
            console.error(`${cid}: messages jumped from ${last_id} to ${id}`)
            jumps[last_id] = id;
        }
        last_id = id;

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
            id,
            text,
            from,
            voice,
            forwarded,
            joined: false,
            date: msg.querySelector('.date.details')?.getAttribute('title') || "",
        }

        messages.push(message)
    })

    return {
        messages,
        from,
        jumps,
        id: cid,
        count: messages.length,
        userName: from
    }
}

function getData(dom: Document): BaseData {
    return {
        name: getInner(dom.querySelector('.personal_info .names .row .value')),
        phone: getInner(dom.querySelector('.personal_info .info .row .value')),
        chats: Array(parseInt(getInner(dom.querySelector('.section.block_link.chats .counter'))) || 1),
        contacts: Array(parseInt(getInner(dom.querySelector('.section.block_link.frequent .counter'))) || 0),
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

function html2chat (chat: HTMLChatData, mids: Record<number, string>): ChatData {
    let last;

    const {messages, jumps, ...chatData} = chat
    const buckets :BucketData[]= []

    let bucket = new_bucket()
    let service = 0
    let jump = 0
    for (let m of messages) {
        if (!m) continue
        const joined = !last ? false
                     : last.from !== m.from ? false
                     : last.date !== m.date ? false
                     : true

        last = last || {id: 0}
        let bid;

        const maybe_new_bucket = bid => {
            if (bucket.messages.length) {
                buckets.push(bucket)
                bucket = new_bucket()
            }
            bucket.start = prettyDate(m.date.split(' ')[0])
            bucket.id = bid
            return bucket;
        }

        if (last.id in jumps) {
            const to = jumps[last.id]
            for (; last.id < to; last.id++) {
                if (! mids[last.id])
                break;
            }
            if (to - last.id > 2) {
                maybe_new_bucket(`jump-${jump++}`)
                bucket.jump_from = last.id
            }
        } else if (bucket.messages.length && (!last || last.date.split(' ')[0] !== m.date.split(' ')[0])) {
            maybe_new_bucket(`service-${service++}`)
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
    const unhandled = []
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

        const make_promise = handler => new Promise((accept, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                const r = e?.target?.result?.toString();
                if (!r) return;
                const dom = parser.parseFromString(r, 'text/html')
                const json = handler(dom)
                if (json) accept(json)
            })
            reader.readAsText(file)
        })

        switch (true) {
            case !!file.name.match(/messages[0-9]*.html/):
                const chat = file.webkitRelativePath.match(/chat_[0-9]+/)
                const id = chat ? chat[0] : "none"
                console.error(`got chats at: ${file.webkitRelativePath}/${file.name}`)
                promises.chats.push(make_promise(dom => getChat(dom, id)))
            case !!file.name.match(/export_results.html/):
                console.error(`got data at: ${file.webkitRelativePath}/${file.name}`)
                promises.data = make_promise(dom => getData(dom))
            default:
                unhandled.push(file.name)
        }
    }

    console.error(`unhandled paths: ${unhandled}`)

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
                       const mids : Record<number, string> = {};
                       let max_id = 0;

                       for (let c of Object.keys(info.chats)) {
                           for (let m of chats[c]?.messages || []) {
                               max_id = Math.max(max_id, m.id);
                               mids[m.id] = c
                           }
                       }

                       for (let c of Object.keys(info.chats)) {
                           chats[c] = html2chat(info.chats[c], mids)
                       }

                       return {...info, chats}
                   })
}
