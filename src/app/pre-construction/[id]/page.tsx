import PreConItem from '@/components/PreConItem/PreConItem';
import { getPreConProject } from '@/data/mockPreConData';
import { notFound } from 'next/navigation';
import React from 'react'

interface PreConstructionItemPageProps {
  params: {
    id: string;
  };
}

const PreConstructionItemPage: React.FC<PreConstructionItemPageProps> = async ({ params }) => {
  const property = getPreConProject(params.id);
  
  if (!property) {
    notFound();
  }

  return (
    <PreConItem />
  )
}

export default PreConstructionItemPage

