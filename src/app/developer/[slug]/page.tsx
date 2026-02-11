"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PreConstructionBasePage from '@/components/PreCon/PreConstructionBasePage';

const DeveloperPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string || '';

  return <PreConstructionBasePage slug={slug} pageType="developer" teamType="developer" />;
};

export default DeveloperPage;

