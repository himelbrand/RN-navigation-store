const { observable, action, computed } = require('mobx')
const { persist } = require('mobx-persist')
const { NavigationActions } = require('react-navigation')

class RoutePersist {
    @persist @observable routeName = ''
    @persist('object') @observable params = null
    constructor(routeName, params) {
        this.routeName = routeName
        this.params = params
    }
}
class NavigatorPersist {
    navigation = null
    @persist @observable shouldPersist = true
    @persist @observable initRoute = null
    @persist @observable parent = null
    @persist @observable name = ''
    @persist('list', RoutePersist) @observable currentStack = []
    @persist('object', RoutePersist) @observable currentRoute = null
    constructor(shouldPersist, initRoute, parent, name) {
        this.shouldPersist = shouldPersist
        this.initRoute = initRoute
        this.parent = parent
        this.name = name
    }
    @computed get CurrentRoute() {
        return this.currentRoute.routeName
    }
    setNavigation(ref) {
        this.navigation = ref
    }
    @action setInitRoute(routeName) {
        this.initRoute = routeName
    }
    @action setShouldPersist(flag) {
        this.shouldPersist = flag
    }
    @action setRoute(route) {
        if (this.currentRoute && (this.currentRoute.routeName !== route.routeName || (route.params && this.currentRoute.params != route.params)))
            this.currentStack.push(this.currentRoute)
        this.currentRoute = new RoutePersist(route.routeName, route.params)
    }
}

class NavigationStore {
    @observable storeHydrated = false
    @persist('map', NavigatorPersist) @observable navigators = new Map()
    @persist @observable activeNavigator = ''
    @persist @observable initialNavigator = ''

    @action setNavigator(name, initRoute, parent = null, shouldPersist = true) {
        if (typeof initRoute === 'string' && initRoute.length > 0 && (!this.navigators.has(name) || this.navigators.get(name).shouldPersist !== shouldPersist || this.navigators.get(name).initRoute !== initRoute || this.navigators.get(name).parent !== parent)) {
            this.navigators.set(name, new NavigatorPersist(shouldPersist, initRoute, parent, name))
            console.log(`new Navigator set: ${name}, if this is not a new navigator name, all of the stack info is now erased`)
        } else if (this.navigators.has(name))
            console.log(`${name} is already set`)
        else
            throw new Error('invalid initial route given, must be string with length of at least 1')
    }
    setNavigation(navigatorName, ref) {
        if (this.navigators.has(navigatorName))
            this.navigators.get(navigatorName).setNavigation(ref)
        else
            throw new Error('no navigator with the given name')

    }
    @action setActiveNavigator(navigatorName) {
        if (this.navigators.has(navigatorName))
            this.activeNavigator = navigatorName
        else
            throw new Error('no navigator with the given name')
    }
    @action setInitialNavigator(navigatorName) {
        if (this.navigators.has(navigatorName))
            this.initialNavigator = navigatorName
        else
            throw new Error('no navigator with the given name')
    }
    @action handleAction(navigatorName, action) {
        if (!action || !navigatorName)
            throw new Error('invalid params')
        if (this.navigators.has(navigatorName)) {
            const navigator = this.navigators.get(navigatorName)
            if (action.type === 'Navigation/BACK') {
                this.goBack(false)
            } else if (action.type === 'Navigation/NAVIGATE') {
                navigator.setRoute({ routeName: action.routeName, params: action.params })
            } else if (action.type === 'Navigation/RESET') {
                action.actions.forEach(resetAction => {
                    if (resetAction.type === 'Navigation/NAVIGATE')
                        navigator.setRoute({ routeName: resetAction.routeName, params: resetAction.params })
                })
            } else {
                console.log(`unhandled navigation action: ${action.type}`)
            }
        } else {
            throw new Error(`no navigator with the given name: ${navigatorName}`)
        }
    }
    @action navigate(route) {//{routeName,params?,action?}
        if (!route)
            throw new Error(`route is required in order to navigate`)
        const navigateAction = NavigationActions.navigate(route)
        const activeNavigator = this.navigators.get(this.activeNavigator)
        const navigation = activeNavigator && activeNavigator.navigation
        const currentRoute = activeNavigator && activeNavigator.currentRoute
        if ((navigation && (currentRoute && (currentRoute.routeName !== route.routeName || (route.params && currentRoute.params !== route.params)))) || navigation)
            navigation.dispatch(navigateAction)
    }
    @action goBack(needAction = false) {
        const navigator = this.navigators.get(this.activeNavigator)
        if (navigator.currentStack.length > 0)
            navigator.currentRoute = navigator.currentStack.pop()
        else if (navigator.parent && navigator.currentStack.length === 0) {
            const parent = this.navigators.get(navigator.parent)
            const parentNav = parent.navigation
            if (needAction) {
                !parentNav.goBack() && parentNav.pop()
                while (parent.currentRoute.routeName.includes('NestedNavigator'))
                    parent.currentRoute = parent.currentStack.pop()
            }
            else if (parent.currentStack.length > 0) {
                parent.currentRoute = parent.currentStack.pop()
                console.log('check this!!!', parent.currentRoute)
                while (parent.currentRoute.routeName.includes('NestedNavigator'))
                    parent.currentRoute = parent.currentStack.pop()
            }
            this.setActiveNavigator(navigator.parent)
        }
    }
    @action reset(actions, index) {
        if (actions.length < index - 1)
            throw new Error('invalid index - out of bounds')
        const resetAction = NavigationActions.reset({
            index: index,
            actions: actions
        })
        const activeNavigator = this.navigators.get(this.activeNavigator)
        const navigation = activeNavigator.navigation
        if (navigation)
            navigation.dispatch(resetAction)
    }
    @action logout() {
        console.log(this.navigators)
        const names = this.NavigatorsNames
        const navigators = names.map(name => this.getNavigator(name))
        navigators.forEach(navigator => {
            const resetAction = NavigationActions.reset({
                index: 0,
                actions: [
                    NavigationActions.navigate({ routeName: navigator.initRoute })
                ]
            })
            navigator.currentStack.clear()
            navigator.currentRoute = null
            console.log(navigator)
            navigator.navigation && navigator.navigation.dispatch(resetAction)
            setTimeout(() => {
                if (navigator.name !== this.initialNavigator)
                    navigator.navigation = null
            }, 1000)
        })
        this.setActiveNavigator(this.initialNavigator)
        
    }
    @action doneHydrating(ready = true, delay = 1500) {
        const navigators = Array.from(this.navigators.values())
        console.log('navigators', navigators)
        const navigatorsNames = Array.from(this.navigators.keys())
        let actions = {}
        navigatorsNames.forEach((name, index) => {
            const navigator = this.navigators.get(name)
            console.log('done hydrating - navigator:', navigator)
            let actions = []
            if (navigator.shouldPersist) {
                actions = navigator.currentStack.map((route) => NavigationActions.navigate(route))
                navigator.currentStack.clear()
                if (navigator.currentRoute)
                    actions.push(NavigationActions.navigate(navigator.currentRoute))
            } else {
                navigator.currentStack.clear()
                actions.push(NavigationActions.navigate({ routeName: navigator.initRoute }))
            }
            console.log('test:', ready, navigator.navigation, actions.length >= 1)
            if (ready && navigator.navigation && actions.length >= 1) {
                let resetAction = NavigationActions.reset({
                    index: actions.length - 1,
                    actions: actions
                })
                navigator.currentRoute = null
                navigator.navigation.dispatch(resetAction)
            } else if (!navigator.currentRoute || !ready) {
                navigator.currentRoute = new RoutePersist(navigator.initRoute)
            }
        })
        setTimeout(() => this.storeHydrated = true, delay)
    }
    @computed get NavigatorsNames() {
        return Array.from(this.navigators.keys())
    }
    getNavigatorStack(navigatorName) {
        return this.navigators.get(navigatorName).currentStack.peek()
    }
    @computed get AllNavigatorsStacks() {
        const names = this.NavigatorsNames
        const stacks = names.map(name => this.getNavigatorStack(name))
        let ans = {}
        for (let i = 0; i < names.length; i++) {
            ans[names[i]] = stacks[i]
        }
        return ans
    }
    @computed get ActiveNavigator() {
        return this.activeNavigator
    }
    @computed get CurrentRoute() {
        return this.navigators.get(this.activeNavigator) && this.navigators.get(this.activeNavigator).currentRoute ?
            this.navigators.get(this.activeNavigator).currentRoute.routeName + '@' + this.activeNavigator :
            'not found'
    }
    @computed get canGoBack() {
        const names = this.NavigatorsNames
        const stacks = names.map(name => this.getNavigatorStack(name))
        const ans = stacks.reduce((acc, curr) => acc || curr.length > 0, false)
        return ans
    }
    getNavigator(navigatorName) {
        return this.navigators.get(navigatorName)
    }
}

const singelton = new NavigationStore()

module.exports = singelton