import { Link } from 'react-router-dom'

const chats = [{
    id: "010",
    userPic: "S",
    userName: "Silvia Majdalani",
    messages: new Array(33)
}, {
    id: "012",
    userPic: "S",
    userName: "Silvio Robles",
    messages: new Array(19)
}, {
    id: "202",
    userPic: "M",
    userName: "Marcelo Violante",
    messages: new Array(150)
}, {
    id: "258",
    userPic: "A",
    userName: "Augusto",
    messages: new Array(335)
}, {
    id: "766",
    userPic: "",
    userName: "Deleted account",
    messages: new Array(1289)
}
]
function ChatItem({ id, userPic, userName, chatType = "private", messages = [] }) {
    return (
        <a className="entry block_link clearfix" href={`../chats/chat_${id}/messages.html#allow_back`}>
            <div className="pull_left userpic_wrap">
                <div className={`userpic userpic${(userName.length % 5) + 1}`} style={{ width: "48px", height: "48px" }}>
                    <div className="initials" style={{ lineHeight: "48px" }}>
                        {userPic}
                    </div>
                </div>
            </div>

            <div className="body">
                <div className="pull_right info details">
                    {chatType}
                </div>
                <div className="name bold">
                    {userName}
                </div>
                <div className="details_entry details">
                    {messages.length} messages
                </div>
            </div>
        </a >
    )
}
function Chats() {
    return (
        <>
            <div className="page_wrap">
                <div className="page_header">
                    <Link className="content block_link" to="/" >
                        <div className="text bold">
                            Chats
                        </div>
                    </Link>
                </div>

                <div className="page_body list_page">
                    <div className="page_about details">
                        This page lists all chats from this export.
                    </div>

                    <div className="entry_list">
                        {chats.map(c => <ChatItem {...c} />)}
                    </div>

                </div>

            </div>
        </>
    )
}

export default Chats
