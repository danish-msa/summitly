import React from 'react'
import { BiEnvelope, BiPhone } from 'react-icons/bi';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import BlurImage from '../../Helper/BlurImage';
import { Agent } from '@/data/data';

type Props = {
    agent: Agent;
}

const AgentCard = ({agent}: Props) => {
  return (
    <div className='flex flex-col gap-4 group w-full'>
        <div className='relative overflow-hidden rounded-2xl'>
            <BlurImage 
                src={agent.image} 
                alt={agent.name} 
                width={1000} 
                height={200} 
                className='rounded-2xl transition-transform duration-500 group-hover:scale-110' 
            />
            <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300'>
                <div className='flex gap-2 justify-center'>
                    {agent.socialMedia.facebook && (
                        <a href={agent.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all">
                            <FaFacebook className="w-4 h-4" />
                        </a>
                    )}
                    {agent.socialMedia.twitter && (
                        <a href={agent.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all">
                            <FaTwitter className="w-4 h-4" />
                        </a>
                    )}
                    {agent.socialMedia.instagram && (
                        <a href={agent.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all">
                            <FaInstagram className="w-4 h-4" />
                        </a>
                    )}
                    {agent.socialMedia.linkedin && (
                        <a href={agent.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all">
                            <FaLinkedin className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>
        </div>
        <div className='flex gap-2 justify-between'>
            <div>
                <h3 className='font-medium text-lg'>{agent.name}</h3>
                <span className='font-light text-gray-600'>{agent.title}</span>
            </div>
            <div className='flex gap-2 justify-end items-center'>
                <a href={`tel:${agent.phone}`} className="flex items-center justify-center text-primary border border-primary w-8 h-8 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <BiPhone className="w-4 h-4" />
                </a>
                <a href={`mailto:${agent.email}`} className="flex items-center justify-center text-primary border border-primary w-8 h-8 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <BiEnvelope className="w-4 h-4" />
                </a>
            </div>
        </div>
        <div className='text-sm text-gray-600'>
            <div className='flex gap-2 flex-wrap'>
                {agent.specialties.slice(0, 2).map((specialty, index) => (
                    <span key={index} className='bg-gray-100 px-2 py-1 rounded-md'>{specialty}</span>
                ))}
            </div>
        </div>
    </div>
  )
}

export default AgentCard