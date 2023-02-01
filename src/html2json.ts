const parser = new DOMParser();

const getChat = (dom) => {
    const messages = []
    let from;
    let forwarded;

    dom.querySelectorAll('.message').forEach(msg => {
        if (msg.classList.contains('service')) {
            return;
        }
        try { from = msg.querySelector('.body > .from_name').innerHTML.trim() } catch (e) { }
        const message = {
            from,
            date: msg.querySelector('.date.details').title,
            id: msg.id
        }
        try { message.text = msg.querySelector('.text').innerHTML.trim() } catch (e) { }
        try {
            const v = msg.querySelector('.media_voice_message')
            message.voice = {
                url: v.href,
                length: v?.querySelector('.status.details').innerHTML.trim()
            }
        } catch (e) { }
        try {
            const f = msg.querySelector('.forwarded.body')
            try { forwarded = f.querySelector('.from_name').innerHTML.trim() } catch (e) { }
            message.forwarded = {
                from: forwarded.split('<')[0],
                date: f.querySelector('.date.details').title
            }
        } catch (e) { }

        messages.push(message)
    })

    return {
        from: dom.querySelector('.page_header .text.bold').innerHTML.trim(),
        messages
    }
}

const getData = (dom) => {
    return {
        name: dom.querySelector('.personal_info .names .row .value').innerHTML.trim(),
        phone: dom.querySelector('.personal_info .info .row .value').innerHTML.trim(),
        chats: dom.querySelector('.section.block_link.chats .counter').innerHTML.trim(),
        contacts: dom.querySelector('.section.block_link.frequent .counter').innerHTML.trim(),
    }
}

export const html2json = (html: string, path: string) => {
    const dom = parser.parseFromString(html, 'text/html')
    switch (true) {
        case !!path.match(/chat_[0-9]+/):
            const id = path.match(/chat_[0-9]+/)[0]
            return {
                ...getChat(dom),
                id,
            }
        case !!path.match(/export_result/):
            return getData(dom)
        default:
            console.error(`unhandled path: ${path}`)
            return
    }
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const prettyDate = date => {
    const parts = date.split('.')
    return [parts[0].replace(/^0/, ''), months[parseInt(parts[1], 10) - 1], parts[2]].join(' ')
}

const chat2bucket = (chat) => {
    let last;
    chat.buckets = []
    let bucket = { messages: [] }
    let service = 0
    for (let m of chat.messages) {
        if (!m) continue
        const joined = !last ? false
            : last.from !== m.from ? false
                : last.date !== m.date ? false
                    : true
        if (!last || last.date.split(' ')[0] !== m.date.split(' ')[0]) {
            if (bucket.messages.length) {
                chat.buckets.push(bucket)
                bucket = { messages: [] }
            }
            bucket.start = prettyDate(m.date.split(' ')[0])
            bucket.id = service++
        }

        bucket.messages.push({ ...m, joined })
        last = m;
    }
    chat.count = chat.messages.length
    delete chat.messages
    return chat
}
export const files2json = (files) => {
    const promises = {
        chats: [],
        data: Promise.resolve({
            chats: []
        })
    }

    for (let file of files) {
        const promise = () => new Promise((accept, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                accept(html2json(e.target.result, file.webkitRelativePath))
            })
            reader.readAsText(file)
        })
        switch (true) {
            case !!file.name.match(/messages[0-9]*.html/):
                promises.chats.push(promise())
                break;
            case !!file.name.match(/export_results.html/):
                promises.data = promise()
                break;
        }
    }

    return promises.data
        .then(data => Promise.all(promises.chats)
            .then(datas => ({
                ...data,
                chats: datas.reduce((a: { string: ChatData }, c: ChatData) => {
                    a[c.id] = {
                        ...c,
                        messages: c.messages.concat(a[c.id]?.messages)
                    }
                    return a
                }, {})
            }))
        ).then(info => {
            for (let k of Object.keys(info.chats)) {
                info.chats[k] = chat2bucket(info.chats[k])
            }
            return info
        })
}
