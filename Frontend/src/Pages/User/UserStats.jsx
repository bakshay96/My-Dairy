import React from 'react'
import UserDashboard from './UserTable/UserDashboard'
import { Heading } from '@chakra-ui/react'
import SelectFarmer from '../Milk/SelectFarmer'

export const UserStats = () => {
  return (
    <>
    <Heading>User Stats</Heading>
    
    <UserDashboard />
    </>
  )
}
