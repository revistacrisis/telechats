import { Link, Form, useLoaderData } from 'react-router-dom'

import { MainContext } from './StateProvider'
import { Header, Page, Body, UserPic, BlockLink, Row } from './Components';
import { ChatData } from './Chat';

export type BaseData = {
    name: string,
    phone: string,
    chats: ChatData[] | Array<any>,
    contacts: Array<any>
}

function PersonalInfo({ name, phone, editing = false}: {
    name: string,
    phone: string,
    editing?: boolean
}) {
    return (
        <div className="personal_info clearfix">
            <UserPic className="pull_right" userName={name} size={90} />
            <Form method="post">
                <Row className="names" label="First Name" value={name} editing={editing} />
                <Row className="info" label="Phone Number" value={phone} editing={editing} />
                {editing && <input type="submit" />}
            </Form>
            <Row className="bio" />
        </div>
    )
}

function RootInfo({ chats = {}, contacts = [], ...props }: {
    chats: Record<string, ChatData>,
    contacts: Array<string>,
    name: string,
    phone: string
}) {
    return (<>
        <MainContext.Consumer>
            {({ state }) => <PersonalInfo {...props} {...state} />}
        </MainContext.Consumer>


        <div className="sections with_divider">
            <BlockLink className="chats" counter={Object.keys(chats).length} to="../lists/chats">Chats</BlockLink>
            <BlockLink className="frequent" counter={contacts.length} to="lists/frequent">Frequent contacts</BlockLink>
        </div>

        <div className="page_about details with_divider">
            Here is the data you requested. Remember: Telegram is ad free, it doesn't use your data for ad targeting and doesn't sell it to others. Telegram only keeps the information it needs to function as a secure and feature-rich cloud service.<br /><br />Check out Settings &gt; Privacy &amp; Security on Telegram's mobile apps for the relevant settings.
        </div>
    </>)
}
function GotoAdmin() {
    return (<>
        <div className="sections with_divider">
            <BlockLink className="chats" to="/admin">Go to Admin</BlockLink>
        </div>
        <div className="page_about details with_divider">
            There is no data to show, you probably should go to admin to add some
        </div>
    </>)
}

function Root() {
    const base = useLoaderData() || {};
    console.error(base)

    return (
        <Page header={<Header>Exported Data</Header>}>
            <Body>
                {(Object.keys(base).length) ? <RootInfo {...base} /> : <GotoAdmin />}
            </Body>
        </Page>
    )
}

export default Root
