drop policy if exists "runtime reads release items for reviewed content"
  on public.reference_library_release_items;

alter table public.reference_library_release_items
  drop constraint if exists reference_library_release_items_content_block_id_fkey;

alter table public.reference_library_release_items
  alter column content_block_id type text using content_block_id::text;

alter table public.reference_content_blocks
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default (gen_random_uuid())::text;

alter table public.reference_library_release_items
  add constraint reference_library_release_items_content_block_id_fkey
  foreign key (content_block_id)
  references public.reference_content_blocks(id)
  on delete restrict;

create policy "runtime reads release items for reviewed content"
  on public.reference_library_release_items
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_library_release_items.compound_id
        and c.review_status = 'reviewed'
    )
    and exists (
      select 1
      from public.reference_content_blocks cb
      where cb.id = reference_library_release_items.content_block_id
        and cb.review_status = 'reviewed'
    )
  );
