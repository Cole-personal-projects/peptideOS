create policy "runtime reads reviewed reference compounds"
  on public.reference_compounds
  for select
  to anon, authenticated
  using (review_status = 'reviewed');

create policy "runtime reads aliases for reviewed reference compounds"
  on public.reference_compound_aliases
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_compound_aliases.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads categories for reviewed reference compounds"
  on public.reference_compound_categories
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_compound_categories.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads forms for reviewed reference compounds"
  on public.reference_compound_forms
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_compound_forms.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads reference citations"
  on public.reference_citations
  for select
  to anon, authenticated
  using (true);

create policy "runtime reads citation links for reviewed reference compounds"
  on public.reference_compound_citations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_compound_citations.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads dose presets for reviewed reference compounds"
  on public.reference_dose_presets
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_dose_presets.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads vial presets for reviewed reference compounds"
  on public.reference_vial_presets
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_vial_presets.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads workflow metadata for reviewed reference compounds"
  on public.reference_workflow_metadata
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_workflow_metadata.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads reviewed reference content blocks"
  on public.reference_content_blocks
  for select
  to anon, authenticated
  using (
    review_status = 'reviewed'
    and exists (
      select 1
      from public.reference_compounds c
      where c.id = reference_content_blocks.compound_id
        and c.review_status = 'reviewed'
    )
  );

create policy "runtime reads reference library releases"
  on public.reference_library_releases
  for select
  to anon, authenticated
  using (true);

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
