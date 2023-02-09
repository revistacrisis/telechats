import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, redirect, useRouteError} from 'react-router-dom';
import { AsRouteConfig, IRoutes, asBrowserRouter } from 'react-router-typing'

import { getStorageValue } from './localstorage';

import Admin from './Admin';
import Chat, { AddChat} from './Chat';
import ChatList from './ChatList';
import Root from './Root';
import StateProvider from './StateProvider';
import ErrorBoundary from './Error';

import type { Params, LoaderFunctionArgs } from 'react-router-dom';
import type {ChatData} from './Chat';
import type {BaseData} from './Root';

type ChatParams = {
  chatId: string,
  messageId: string
}

type ActionArgs<Type> = {
  request: Request,
  params: Type
}

import './style.css';
import './index.css';

const updateChat = (data: BaseData, chat: number, old: string, cur: string) => {
  for (let b = 0; b < data.chats[chat].buckets.length; b++) {
    for (let m = 0; m < data.chats[chat].buckets[b].messages.length; m++) {
      if (data.chats[chat].buckets[b].messages[m].from === old)
        data.chats[chat].buckets[b].messages[m].from = cur
    }
  }
}

const findMessage = (id: string, chat: ChatData) => {
  for (let b in chat.buckets) {
    for (let m in chat.buckets[b].messages) {
      if (chat.buckets[b].messages[m].id === id)
        return m;
    }
  }
  return null
}

const getFormData = (iter: FormData) => {
  const formData : Record<string, string> = {}
  for (let [k, v] of iter) {
    formData[String(k)] = v.toString();
  }
  return formData;
}

const routes =  [
  { path: "/", loader: () => redirect("/admin"), errorElement: <ErrorBoundary /> },
  { path: "/admin", element: <Admin />, errorElement: <ErrorBoundary />, children: [
  { path: "", loader: () => redirect("root") },
  {
    path: "root", element: <Root />, errorElement: <ErrorBoundary />,
    loader: () => getStorageValue('data', {}),
    action: async ({ request }: ActionArgs<Params>) => {
      let damage = 0;
      console.error('root action')
      const formData = await request.formData()
      const data = getStorageValue('data', {})
      for (let [k, v] of formData.entries()) {
        switch (true) {
          case k === 'names':
            if (v !== data.name) {
              damage++;
              for (let c of Object.keys(data.chats)) {
                updateChat(data, parseInt(c), data.name, v.toString());
              }
              data.name = v
            }
            break;
          case k === 'info':
            if (v !== data.phone) {
              damage++;
              data.phone = v
            }
        }
        damage && localStorage.setItem('data', JSON.stringify(data))
        return data
      }
      return
    }
  }, {
    path: "lists/chats", element: <ChatList />,
    loader: () => getStorageValue('data', {}).chats,
    action: async ({ request }: ActionArgs<Params>) => {
      const formData = await request.formData()
      const data = getStorageValue('data', {})
      console.error('chat action')
      let damage = 0
      for (let [k, v] of formData.entries()) {
        if (data.chats[k].from !== v) {
          damage++
          updateChat(data, parseInt(k), data.chats[k].from, v.toString())
          data.chats[k].from = v
        }
      }

      damage && localStorage.setItem('data', JSON.stringify(data))
      return data.chats
    }
  }, {
    path: "chats/:chatId/messages", element: <Chat />,
    loader: ({ params }: ActionArgs<ChatParams>) => getStorageValue('data', {}).chats[params.chatId],
    action: async ({ request, params }: ActionArgs<ChatParams>) => {
      const formData = await request.formData()
      const base = getStorageValue('data', {})
      console.error('message action')
      delete base.chats
      const chat = base.chats[params.chatId]
      return { ...base, chat }
    },
    children: [{
      path: "edit/after/:messageId",
      element: <AddChat />,
      loader: ({params}: ActionArgs<ChatParams>) => {
        const base = getStorageValue('data', {})
        const chat = base.chats[params.chatId]
        const msg = findMessage(params.messageId, chat)

        delete base.chats
        return { ...base, chat, msg }
      },
      action: async ({request, params}: ActionArgs<ChatParams>) => {
        const formData = getFormData(await request.formData())
        const data = getStorageValue('data', {})
        let damage = 0;
        console.error('message edit action', formData, data)

        const chat = data.chats[params.chatId]
        delete data.chats
        return { ...data, chat }
      }
    }
    ]
  },
    { path: "lists/frequent" },
  ] }
] as const satisfies IRoutes

export type RouteConfig = AsRouteConfig<typeof routes>
const router = createBrowserRouter(asBrowserRouter(routes))

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StateProvider>
      <RouterProvider router={router} />
    </StateProvider>
  </React.StrictMode>,
)
