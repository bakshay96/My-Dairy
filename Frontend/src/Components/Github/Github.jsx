import React, { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import ProgressBar from '../Progress';

function Github() {
    //const data = useLoaderData()
    const [data, setData] = useState([]);
    useEffect(async () => {
    
    await fetch(`https://api.github.com/users/bakshay96`)
     .then(response => response.json())
     .then(data => {
        console.log(data);
        setData(data)
     })
    }, [])
    
  return (
    
      
    <div id='github' className='text-center m-4 bg-gray-600 text-white p-4 text-3xl'>Github followers: {data.followers}
    <img src={data.avatar_url} alt="Git picture" width={300} />
    </div>
   
  )
}

export default Github

export const githubInfoLoader = async () => {
    const response = await fetch('https://api.github.com/users/bakshay96')
    return response.json()
}