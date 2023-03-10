import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ReactChild = string | ReactNode | ReactNode[] | null;

export function UserPic({ userName, className = "pull_left", size = "48", ...props }: {
    userName: string,
    className?: string,
    size?: number | string,
}) {
    return (
        <div className={`${className} userpic_wrap`} {...props}>
            <div className={`userpic userpic${(userName.length % 5) + 1}`} style={{ width: `${size}px`, height: `${size}px` }}>
                <div className="initials" style={{ lineHeight: `${size}px` }}>
                    {userName.split(' ').map(c => c[0])}
                </div>
            </div>
        </div >
    )
}

export function Body({ className, children }: {
    className?: string,
    children: ReactChild
}) {
    return (
        <div className={`page_body ${className}`}>
            {children}
        </div>
    )
}

export function Page({ className, header, children }: {
    header: ReactChild,
    children: ReactChild,
    className?: string,
}) {
    return (
        <div className={`page_wrap ${className}`}>
            {header}
            {children}
        </div>
    )
}

function LinkOrDiv({ to, children, className = "content", ...props }: {
    className?: string,
    to?: string,
    children: ReactChild
}) {
    if (to) return (
        <Link className={`${className} block_link`} to={to} {...props}>
            {children}
        </Link>)
    return (
        <div className={`${className}`} {...props}>
            {children}
        </div>
    )
}

export function Header({ back, children }: {
    children: ReactChild,
    back?: string,
}) {
    return (
        <div className="page_header">
            <LinkOrDiv to={back}>
                <div className="text bold">
                    {children}
                </div>
            </LinkOrDiv>
        </div>
    )
}

export function Row({ className, label, value, editing, ...props }: {
    className?: string,
    label?: ReactChild,
    value?: ReactChild | string,
    editing?: boolean,
}) {
    return (
        <div className={`rows ${className}`} {...props}>
            {value ?
             <div className="row">
                 <div className="label details">
                     {label}
                 </div>
                 <div className="value bold">
                     {editing ? <input type="text" name={className?.trim()} defaultValue={value} /> : value}
                 </div>
             </div>
            : null
            }
        </div>
    )
}

export function BlockLink({ className, counter, to, children, ...props }: {
    className: string | null,
    to: string,
    children: ReactChild,
    counter?: ReactChild,
}) {
    return (
        <LinkOrDiv className={`section block_link ${className}`} to={to} {...props}>
            {counter && <div className="counter details">
                {counter}
            </div>}

            <div className="label bold">
                {children}
            </div>
        </LinkOrDiv>)
}
