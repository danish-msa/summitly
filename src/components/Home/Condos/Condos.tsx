import React from 'react'

const Condos = () => {
  return (
    <div className='flex flex-col md:flex-row items-center justify-between gap-2 bg-secondary p-10 md:p-20 relative'>
        <h2 className='text-left text-2xl md:text-5xl  md:w-[50%] text-white mb-4 capitalize'>Find Condos in your favourite area</h2>
        <div className='flex gap-4 flex-wrap w-full md:w-[50%]'>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>King West</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>The Waterfront</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>Mimico</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>Church St. Corridor</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>Bay St. Corridor</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>Willowdale East</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>Islington | City Centre West</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>St. Lawrence</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>Queen West</button>
            <button className='btn btn-primary bg-primary hover:bg-white hover:text-primary text-sm md:text-lg hover:bg-primary'>Yonge and Bloor</button>
        </div>
    </div>
  )
}

export default Condos