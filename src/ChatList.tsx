import { Form, Link, useLoaderData } from 'react-router-dom'

import { ChatData } from './Chat'
import { Body, Header, Page, UserPic } from './Components'
import { MainContext } from './StateProvider'

function ChatItem({ id, from, editing, chatType = "private", count }: ChatData) {
    return (
        <Link className="entry block_link clearfix" to={!editing && `../chats/${id}/messages`}>
            <UserPic userName={from} />

            <div className="body">
                <div className="pull_right info details">
                    {chatType}
                </div>
                <div className="name bold">
                    {editing ? <input type="text" name={id} defaultValue={from} /> : from}
                </div>
                <div className="details_entry details">
                    {count} messages
                </div>
            </div>
        </Link >
    )
}

function ChatList() {
    const chats = useLoaderData();
    console.error(chats)

    return (
        <Page header={<Header back="../">Chats</Header>}>`
            <Body className="list_page">
                <div className="page_about details">
                    This page lists all chats from this export.
                </div>
                <MainContext.Consumer>
                    {({ state }) => (
                        <div className="entry_list">
                            <Form method="post">
                                {state.editing && <input type="submit" />}
                                {Object.values(chats).map(c => <ChatItem key={c.id} {...c} {...state} />)}
                            </Form>
                        </div>
                    )}
                </MainContext.Consumer>

            </Body>
        </Page>
    )
}

export default ChatList
