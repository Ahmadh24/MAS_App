import { View, Text } from 'react-native'
import React from 'react'
import { TabArrayType } from '@/src/types'
const TabArray : TabArrayType[] = [
    { name: "menu", title : "Home", icon : "house.fill" },
    { name: "myPrograms", title : "My Library", icon : "book" },
    { name: "prayersTable", title : "Prayer Times", icon : "clock" },
    { name: "more", title : "More", icon : "ellipsis.bubble.fill" }
]

export default TabArray


{/* 

     <Tabs.Screen
        name="menu"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={color} />
          ),
        }}
      />
    
*/}