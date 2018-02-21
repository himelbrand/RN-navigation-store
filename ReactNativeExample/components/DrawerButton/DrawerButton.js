import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { inject, observer } from 'mobx-react/native'
import { Button } from '..'
import NavigationStore from 'mobx-react-navigation-store'

@observer
class DrawerButton extends Component {
    constructor(props) {
        super(props)
        this.drwaerNav = NavigationStore.getNavigator('MainDrawer')
    }

    render() {
        return (
            <View style={Style.container}>
                
                <Button style={Style.button} onPress={() => {
                    this.drwaerNav.toggle()
                }}>
                    <Text style={Style.buttonText}>Drawer</Text>
                </Button>

            </View>
        )
    }
}
const Style = StyleSheet.create({
    title:{
        alignSelf:'center',
        textAlign:'center',
        fontSize:25,
    },
    container:{
        position:'absolute',

        top:30,
        right:10,
        zIndex:1
    },
    button:{
        height:60,
        width:60,
        borderRadius:30,
        backgroundColor:'white',
        justifyContent:'center',
        alignItems:'center'



    },
    buttonText:{
        fontSize:15
    }
})
export default DrawerButton