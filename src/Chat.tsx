import { ReactElement, useState, useRef, useEffect } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { Form, Link, Outlet, useLoaderData } from 'react-router-dom';
import { Body, Header, Page, UserPic } from './Components';
import { MainContext } from './StateProvider';
import { teletime2norm } from './utils';

import './chat.css';

export type ForwardedData = {
    from: string;
    date: string;
}
export type MessageData = {
    id: string;
    text: string | undefined;
    date: string;
    from: string;
    joined: boolean;
    voice?: {
        url: string;
        length: string;
    };
    forwarded?: ForwardedData;
}
export type BucketData = {
    start: string;
    id: number;
    messages: MessageData[];
}
export type ChatData = {
    id: string;
    userName: string;
    chatType: "private";
    count: number;
    buckets: BucketData[];
}

export function AddChat() {
    const { name, chat, msg } = useLoaderData();
    const [selected, setSelected] = useState<string>(name)

    console.error(msg, teletime2norm(msg.date))
    const to = selected === name ? chat.from : name;
    return (
        <div className="personal_info clearfix">
            <Form method="put">
                <div style={{ display: 'flex' }}>
                    <span className="label bold">from </span>
                    <UserPic className="pull_none" onClick={() => setSelected(to)} userName={selected} size={60} />
                    <input type="hidden" name="to" value={to} />
                    <input type="hidden" name="after" value={msg.id} />
                    <input type="datetime-local" name="date" defaultValue={teletime2norm(msg.date)} />
                    <input type="text" name="message" />
                    <button type="submit">Send</button>
                    <span className="label bold">to </span>
                    <UserPic className="pull_none" onClick={() => setSelected(to)} userName={to} size={48} />
                </div>
            </Form>
        </div>
    )
}

function ServiceMessage({ id, children }: { id: number, children: ReactElement }) {
    return (
        <div className="message service" id={`message-${id}`}>
            <div className="body details">
                {children}
            </div>
        </div>
    )
}

function Forwarded({ forwarded, text }: { forwarded: ForwardedData, text: string }) {
    return (
        <>
            <UserPic userName={forwarded.from} />
            <div className="forwarded body">
                <div className="from_name">
                    {forwarded.from}
                    <span className="date details" title={forwarded.date}> {forwarded.date}</span>
                </div>
                {text}
            </div>
        </>
    )
}
const rows = (value: string = "") =>
    Math.round(value.length / 20)
    + (value.match(/\n/g) || []).length
    + (value.match(/<b>/g) || []).length;

function EditableTextArea({ id, text }: MessageData) {
    const updateTextArea = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        e.stopPropagation()
        e.target.rows = rows(e.target.value)
    }

    return (
        <div className="text">
            <textarea name={id} cols={30} rows={rows(text)}
                defaultValue={(text || "").replace(/<br>/g, '\n').replace(/&nbsp;/g, ' ')}
                onKeyUp={updateTextArea} />
        </div>
    )
}
function Message({ editing, msg }: { editing: boolean, msg: MessageData }) {
    if (!msg) return null;

    const text = editing ? <EditableTextArea {...msg} /> : <div className="text" dangerouslySetInnerHTML={{ __html: msg.text }} />
    return (
        <>
            <div className={`message default clearfix ${msg.joined && 'joined'}`} id={msg.id}>
                {msg.joined || <UserPic userName={msg.from} />}
                <div className="body">
                    <div className="pull_right date details" title={msg.date}>
                        {         /* "09.11.2022 09:48:50 -03" */
                            //msg.date.split(' ')[1].split(':').slice(0, 2).join(':')
                        }
                    </div>

                    {msg.joined || <div className="from_name">
                        {msg.from}
                    </div>}
                    {
                        msg.forwarded ? <Forwarded forwarded={msg.forwarded} text={text} /> : text
                    }
                </div>
            </div>
        </>
    )
}

function FormOrDiv({ editing, children, ...props }) {
    if (editing)
        return (
            <Form {...props}>
                {editing && <input type="submit" />}
                {children}
            </Form>
        )
    return (<div {...props}>{children}</div>)
}

function Bucket({ id, start, messages,...props }) {
    return (
        <>
            {messages.length ? <ServiceMessage id={id}>{start}</ServiceMessage> : null}
            {messages.map(m => (
                <>
                    <Message key={m.id} msg={m} {...props}/>
                </>
            ))}
        </>
    )
}

function EditableBucket({...props}) {
    const [bucket, setBucket] = useState<BucketData>({
        start: 'now',
        id: 0,
        messages: []
    })
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault()
        setBucket({
            ...bucket,
            messages: [...bucket.messages, {
                id: 0,
                text: e.target.msg.value,
                date: 'now',
                from: 'me'
            }]
        })
        e.target.msg.value = ""
        inputRef.current.focus()
        setTimeout(() => inputRef.current.scrollIntoView({ behaviour: "smooth" }), 50)
    }

    return (
            <Flipper flipKey={JSON.stringify(bucket)}>
            <Flipped flipId="bucket">
            <Bucket {...bucket} {...props}/>
            </Flipped>
            <form onSubmit={handleSubmit}>
            <input type="text" name="msg" placeholder="keep chatting" ref={inputRef} />
            <button type="submit">send</button>
            </form>
            </Flipper>
            )
}

function Chat() {
    const [addChatAfter, setAddChatAfter] = useState<string>("");

    const chat: ChatData = useLoaderData()
    if (!chat) return null

    return (
            <Page header={<Header back="../lists/chats">{chat?.from}</Header>} className="reverse">
            <Body className="chat_page">

            <MainContext.Consumer>
            {({ state }) => (
                <FormOrDiv editing={!!!addChatAfter || state.editing}>
                    {chat.buckets.map(b => <Bucket {...b} {...state} />)}
                </FormOrDiv>
            )}
            </MainContext.Consumer>
            <EditableBucket />

            </Body>
            </Page >
            )
}
export default Chat
