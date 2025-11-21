'use server';

import { revalidatePath } from 'next/cache';

import { createPage, deletePage, movePage, updatePage } from '@/lib/cms/pages';
import type { PageStatus } from '@/lib/cms/types';

import { requireAdmin } from '@/lib/auth/guards';

export async function createPageAction(formData: FormData): Promise<void> {
  await requireAdmin('/admin/pages');

  const title = (formData.get('title') ?? '').toString().trim();
  const parentId = (formData.get('parentId') ?? '').toString().trim() || null;
  const slug = (formData.get('slug') ?? '').toString().trim() || undefined;
  const status = (formData.get('status') ?? '').toString().trim() as PageStatus | '';

  if (!title) {
    throw new Error('Title is required');
  }

  await createPage({
    title,
    parentId,
    slug,
    status: status && ['draft', 'review', 'published', 'archived'].includes(status) ? status : 'draft'
  });

  revalidatePath('/admin/pages');
  revalidatePath('/');
}

export async function updatePageAction(formData: FormData): Promise<void> {
  await requireAdmin('/admin/pages');

  const pageId = (formData.get('pageId') ?? '').toString().trim();
  const title = (formData.get('title') ?? '').toString().trim() || undefined;
  const slug = (formData.get('slug') ?? '').toString().trim() || undefined;
  const path = (formData.get('path') ?? '').toString().trim() || undefined;
  const status = (formData.get('status') ?? '').toString().trim() as PageStatus | '';

  if (!pageId) {
    throw new Error('Missing page identifier');
  }

  await updatePage({
    pageId,
    title,
    slug,
    path,
    status: status && ['draft', 'review', 'published', 'archived'].includes(status) ? status : undefined
  });

  revalidatePath('/admin/pages');
  revalidatePath('/');
}

export async function deletePageAction(formData: FormData): Promise<void> {
  await requireAdmin('/admin/pages');

  const pageId = (formData.get('pageId') ?? '').toString().trim();

  if (!pageId) {
    throw new Error('Missing page identifier');
  }

  await deletePage(pageId);
  revalidatePath('/admin/pages');
  revalidatePath('/');
}

export async function movePageAction(formData: FormData): Promise<void> {
  await requireAdmin('/admin/pages');

  const pageId = (formData.get('pageId') ?? '').toString().trim();
  const direction = (formData.get('direction') ?? '').toString().trim() as 'up' | 'down';

  if (!pageId || (direction !== 'up' && direction !== 'down')) {
    throw new Error('Invalid move request');
  }

  await movePage({ pageId, direction });
  revalidatePath('/admin/pages');
  revalidatePath('/');
}
