'use client';
import { useApp } from '@/context/AppContext';
import { SearchModal }    from './SearchModal';
import { HistoryModal }   from './HistoryModal';
import { FavoritesModal } from './FavoritesModal';
import { SkillsModal }    from './SkillsModal';

export function ModalRoot() {
  const { activeModal } = useApp();
  return (
    <>
      <SearchModal    open={activeModal === 'search'}    />
      <HistoryModal   open={activeModal === 'history'}   />
      <FavoritesModal open={activeModal === 'favorites'} />
      <SkillsModal    open={activeModal === 'skills'}    />
    </>
  );
}
