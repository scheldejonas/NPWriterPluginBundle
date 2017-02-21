//http://dev.lca.infomaker.io/

import io from 'socket.io-client'
import {Component} from 'substance'
import { api, moment} from 'writer'
import LoginComponent from './LoginComponent'

class UATrackerComponent extends Component {

    constructor(...args) {
        super(...args)


    }

    getInitialState() {
        return {
            username: null,
            email: null,
            users: []
        }
    }


    didMount() {
        // If no username specified make sure to show dialog

        this.showLogin()

    }

    showLogin() {
        if (api.history.isAvailable()) {
            const user = api.history.storage.getItem('user')
            if (user) {
                this.login(JSON.parse(user))
            } else {
                api.ui.showDialog(LoginComponent, {login: this.userLogin.bind(this)}, {
                    title: "Logga in",
                    primary: this.getLabel('Continue'),
                    secondary: false
                })
            }
        }
    }


    socketConnectError() {
        this.props.popover.setIcon('fa-chain-broken')
        this.props.popover.setStatusText(this.getLabel('No connection'))
        this.extendState({
            users: [],
            socketId: null
        })
    }
    setupLiveArticles() {

        const uuid = api.newsItem.getGuid()
        const customerKey = api.getConfigValue('se.infomaker.uatracker', 'customerKey')
        const host = api.getConfigValue('se.infomaker.uatracker', 'host')

        this.socket = io(host)

        this.socket.on('connect_error', this.socketConnectError.bind(this))

        this.socket.on('error', () => {
            // Handle error
        })

        this.socket.on('connect', () => {

            this.updateIcon([])

            /*
             Trigger an event telling the server that we have opened this article
             */
            const information = {
                uuid: uuid,
                timestamp: moment().format('X'),
                socketId: this.socket.id,
                customerKey: customerKey,
                name: this.state.name,
                email: this.state.email
            }


            this.socket.emit('article/opened', information)

            this.socket.on('article/initial-users', (users) => {
                this.extendState({
                    users: users,
                    socketId: this.socket.id
                })
                this.updateIcon(users)
            })

            this.socket.on('article/user-connected', (user) => {
                const allUsers = this.state.users
                allUsers.push(user)
                this.updateIcon(allUsers)
                api.ui.showNotification('se.infomaker.uatracker', this.getLabel('User connected'), user.email + ' has opened this article')
                this.extendState({
                    users: allUsers
                })
            })

            this.socket.on('article/user-disconnected', (user) => {
                const allUsers = this.state.users
                const disconnectedUser = allUsers.find((u) => {
                    return u.socketId === user.socketId
                })
                const idx = this.state.users.indexOf(disconnectedUser)
                allUsers.splice(idx, 1)
                this.updateIcon(allUsers)
                api.ui.showNotification('se.infomaker.uatracker', this.getLabel('User connected'), user.email + ' has closed this article')
                this.extendState({
                    users: allUsers
                })
            })

        })


    }

    updateIcon(users) {
        if (users.length > 1) {
            this.props.popover.setIcon('fa-group')
            this.props.popover.setStatusText(users.length + this.getLabel('connected-users-qty-connected'))
        } else {
            this.props.popover.setIcon('fa-user')
            this.props.popover.setStatusText(this.state.name)
        }
    }

    dispose() {
    }

    login({email, name}) {

        this.extendState({
            email: email,
            name: name
        })
        this.setupLiveArticles()
    }

    userLogin(user) {
        if (api.history.isAvailable()) {
            api.history.storage.setItem('user', JSON.stringify(user))
        }
        this.login(user)

    }

    logout() {
        if (api.history.isAvailable()) {
            api.history.storage.removeItem('user')
            this.socket.close()
            this.showLogin()
        }
        this.extendState({
            email: null,
            name: null,
            socketId: null
        })
    }

    render($$) {

        const el = $$('div').addClass('uatracker')


        el.append($$('h2').append(this.getLabel('connected-users-headline')))
        el.append($$('p').append(this.getLabel('connected-users-description')))

        const Avatar = api.ui.getComponent('avatar')

        const userList = $$('ul').addClass('user-list authors__list')
        const userEls = this.state.users.map((user) => {
            const item = $$('li').addClass('authors__list-item')
            const avatarEl = $$(Avatar, {avatarSource: 'gravatar', avatarId: user.email}).ref('avatar-'+user.socketId)

            const container = $$('div').addClass('metadata__container')
            if (user.socketId === this.state.socketId) {
                item.addClass('current')
                container.append($$('span').addClass('active-user').append(this.getLabel('(You)')))
            }

            item.append([
                avatarEl,
                container.append([
                    $$('span').addClass('author__name meta').append(user.name),
                    $$('span').addClass('author__email').append(user.email)
                ])
            ])


            return item
        })
        userList.append(userEls)
        el.append(userList)


        if (this.state.email) {

            const logoutButton = $$('button').addClass('btn sc-np-btn').append(this.getLabel('Log out')).on('click', this.logout)

            el.append(logoutButton)
        }


        return el
    }
}

export default UATrackerComponent