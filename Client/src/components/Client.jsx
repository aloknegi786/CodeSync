import React from 'react'
import Avatar from '@mui/material/Avatar'
import { deepOrange } from '@mui/material/colors'

function Client({ username }) {
  return (
    <div className='client'>
        <Avatar sx={{ bgcolor: deepOrange[500], borderRadius: 3, width: 52, height: 48 }}>
          {username?.charAt(0).toUpperCase()}
        </Avatar>
        <span className='userName'>{username}</span>
    </div>
  )
}

export default Client
