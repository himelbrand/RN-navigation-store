
import React, { Component }from 'react'
import { DrawerNavigator, NavigationActions } from 'react-navigation'
import { observer, inject } from 'mobx-react/native'
import NavigationStore from '..'
import { AppState } from 'react-native'


const create = (name ,routeConfigs, drawerNavigatorConfig) => {
    const realNavigatorConfig = drawerNavigatorConfig
    if (!realNavigatorConfig.backBehavior)
        realNavigatorConfig.backBehavior = 'none'
    const navigator = DrawerNavigator(
        routeConfigs,
        realNavigatorConfig
    )
    return props => <DrawerNav name={name} nav={navigator} {...props} />
}

@observer
class DrawerNav extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nowMounted: false,
            appState: AppState.currentState
        }

    }
    componentWillMount() {
        AppState.removeEventListener('change', this._handleAppStateChange)
    }
    componentDidMount() {
        this.setState({ nowMounted: true })
        NavigationStore.setActiveNavigator(this.props.name)
        AppState.addEventListener('change', this._handleAppStateChange)
    }
    _handleAppStateChange = (nextAppState) => {
        if (this.state.appState && this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            this.setState({ nowMounted: true,appState: nextAppState})
        }
    }
    render() {
        const Navigator = this.props.nav
        const name = this.props.name
        return (
            <Navigator
                ref={ref => {
                    if (ref && (!NavigationStore.getNavigator(name).navigation || this.state.nowMounted)) {
                        this.setState({ nowMounted: false })
                        try {
                            NavigationStore.setNavigation(name, ref._navigation)
                            this.props.ref && this.props.ref(ref)
                        } catch (err) {
                            console.log(err)
                        }
                    }
                }}
                onNavigationStateChange={(oldState, newState, action) => {
                    NavigationStore.handleAction(name, oldState, newState, action)
                    this.props.onNavigationStateChange && this.props.onNavigationStateChange(oldState, newState, action)
                }}
                screenProps={this.props.screenProps}
            />

        )
    }
}
export default create