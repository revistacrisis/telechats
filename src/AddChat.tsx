import { useState } from 'react';
import { Form, useLoaderData } from 'react-router-dom';
import { BlockLink, Page, Row, UserPic } from './Components';

export default function AddChat() {
    const { name, chat } = useLoaderData();
    const [selected, setSelected] = useState<string>(name)

    const to = selected === name ? chat.from : name;
    return (
        <div className="personal_info clearfix">
            <Form method="put">

                <span className="label bold">to </span>
                <UserPic className="pull_none" onClick={() => setSelected(to)} userName={to} size={48} />
                <div style={{ display: 'flex' }}>
                    <span className="label bold">from </span>
                    <UserPic className="pull_none" onClick={() => setSelected(to)} userName={selected} size={60} />
                    <input type="text" />
                    <input type="button" value="Send" />
                </div>
            </Form>
        </div>
    )
}
