import { Outlet } from 'react-router-dom'
import { ChangeEvent, useRef } from 'react';

import { BlockLink, Body, Header, Page } from './Components';
import { ChatData } from './Chat';
import { BaseData } from './Root';
import { MainContext } from './StateProvider';

import { files2json } from './html2json.js';
import { useLocalStorage } from './localstorage.js';

import './admin.css'

function Admin() {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [data, setData] = useLocalStorage<BaseData>('data', {})

    const fileChanged = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        if (!target || !target.files) return
        setData({})
        setData(await files2json(target.files))
    }
    return (
        <Page className="sidebar" header={<Header back="/">Admin</Header>}>
            <Body className="sidebar">
                <div className="sections with_divider">
                    <BlockLink className="sessions">
                        <input type="file" webkitdirectory="true" mozdirectory="true" directory="true" multiple ref={inputRef} onChange={fileChanged} />
                    </BlockLink>
                    <MainContext.Consumer>
                        {({ state, setState }) => (
                            <BlockLink className={state.editing ? "other" : "chats"} onClick={() => setState({
                                ...state,
                                editing: !!!state.editing
                            })}>{state.editing ? "Stop Edit" : "Edit"}</BlockLink>
                        )}
                    </MainContext.Consumer>
                    {data.name && <BlockLink className="contacts" to="/admin">{`${data.name} - ${data.phone}`}</BlockLink>
                    }
                    {data.chats && Object.keys(data.chats).length && Object.entries(data.chats).map(([k, v]: [string, ChatData]) =>
                        <BlockLink key={k} to={`chats/${v.id}/messages`} className="web" counter={`${v.count} messages`}>{`${k} ${v.from}`}</BlockLink>
                    )}
                </div>

                <div className="page_about details with_divider">
                    Upload chats and other shinaneegans
                </div>
            </Body>
            <div className="main">
                <Outlet />
            </div>
        </Page>
    )
}

export default Admin
