import { Client } from '@widgetbot/embed-api'
import * as React from 'react'

import { Embed, Root } from './elements'
import { generateUUID, searchParams } from './util'

export interface Props {
    server?: string
    channel?: string
    thread?: string
    shard?: string
    username?: string
    avatar?: string
    token?: string
    notifications?: boolean
    notificationTimeout?: number
    accessibility?: string[]
    settingsGroup?: string

    defer?: boolean

    className?: string
    onAPI?: (api: Client) => void

    style?: React.CSSProperties
    height?: number | string
    width?: number | string
    focusable?: boolean

    options?: { [key: string]: string }
}

export default class WidgetBot extends React.PureComponent<Props> {
    static defaultProps: Props = {
        server: '299881420891881473',
        shard: 'https://e.widgetbot.io',
        options: {},
        defer: false,
        focusable: true
    }

    state = {
        url: null as any,
        id: generateUUID()
    }

    api = new Client({
        id: this.state.id,
        iframe: null
    })

    static getDerivedStateFromProps(props: Props, state: any) {
        let shard = props.shard
        if (!shard.startsWith('http')) shard = `https://${shard}`
        if (shard.endsWith('/')) shard = shard.substring(0, shard.length - 1)

        let params: { [key: string]: string | number | boolean } = {
            ...props.options,
            api: state.id
        }
        if (props.thread) params.thread = props.thread
        if (props.username) params.username = props.username
        if (props.avatar) params.avatar = props.avatar
        if (props.token) params.token = props.token
        if (props.notifications) params.notifications = props.notifications
        if (props.notificationTimeout) params.notificationtimeout = props.notificationTimeout
        if (props.accessibility) params.accessibility = props.accessibility.join()
        if (props.settingsGroup) params['settings-group'] = props.settingsGroup

        const url = `${shard}/channels/${props.server}${
            props.channel ? `/${props.channel}` : ''
        }/${searchParams(params)}`

        return { url }
    }

    componentDidMount() {
        const { onAPI } = this.props

        if (onAPI) onAPI(this.api)
    }

    render() {
        const { defer, className, style, height, width, focusable } = this.props

        return (
            <div
                className={className}
                style={{ ...Root({ width, height }), ...style }}
            >
                <iframe
                    src={defer ? '' : this.state.url} //@ts-ignore
                    ref={ref => (this.api.iframe = ref)}
                    style={Embed}
                    tabIndex={focusable ? null : -1}
                    allow="clipboard-write; fullscreen"
                    title="Discord chat embed"
                />
            </div>
        )
    }
}