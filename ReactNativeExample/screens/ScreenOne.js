import React, { Component } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { Button } from '../components'
import { observer, inject } from 'mobx-react/native';

@inject('NavigationStore')
@observer
class ScreenOne extends Component {
    constructor(props) {
        super(props)
    }
    static navigationOptions = {
        title: 'ScreenOne',
      }
    render() {
        return (
            <View style={Style.container}>
                    <View style={{ flexDirection: 'row' }}>
                        <Button style={Style.button} onPress={() => {
                            this.props.NavigationStore.navigate({ routeName: 'MainSecond' })
                        }}>
                            <Text style={Style.buttonText}>Screen 2</Text>
                        </Button>
                        <Button style={Style.button} onPress={() => {
                            this.props.NavigationStore.navigate({ routeName: 'MainThird' })
                        }}>
                            <Text style={Style.buttonText}>Screen 3</Text>
                        </Button>
                        <Button style={[Style.button,{backgroundColor:'#B4D2BA'}]} onPress={() => {
                            this.props.NavigationStore.navigate({ routeName: 'NestedNavigator' })
                        }}>
                            <Text style={Style.buttonText}>Nested stack</Text>
                        </Button>
                    </View>
            </View>
        )
    }

}
const Style = StyleSheet.create({
    container: {
        backgroundColor: '#F3B3A6',
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    h1: {
        fontSize: 35,
        color: 'red',
    },
    text: {
        fontSize: 50,
        color: 'black',
        margin: 100,
        backgroundColor: 'blue'
    },
    button: {
        width: 100,
        height: 75,
        margin: 20,
        borderWidth: 2,
        borderColor: "#ecebeb",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 40
    }
})
export default ScreenOne