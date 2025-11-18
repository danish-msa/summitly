import PreConItem from '@/components/PreConItem/PreConItem';
import { getPreConProject } from '@/data/mockPreConData';
import { notFound } from 'next/navigation';
import React from 'react'

interface PreConstructionItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

const PreConstructionItemPage: React.FC<PreConstructionItemPageProps> = async ({ params }) => {
  const { id } = await params;
  const property = getPreConProject(id);
  
  if (!property) {
    notFound();
  }

  return (
    <PreConItem />
  )
}

export default PreConstructionItemPage

