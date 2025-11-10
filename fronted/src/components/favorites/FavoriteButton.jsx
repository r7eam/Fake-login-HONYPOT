import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useCheckFavorite, useToggleFavorite } from '../../hooks/useFavorites.js';
import { useAuth } from '../../context/AuthContext';

function FavoriteButton({ workerId, showTooltip = true, onToggle }) {
  const { user } = useAuth();
  const { data: favorite, isLoading, refetch } = useCheckFavorite(workerId);
  const toggleFavorite = useToggleFavorite();
  const [localFavorited, setLocalFavorited] = useState(null);

  // Sync local state with fetched data
  useEffect(() => {
    if (!isLoading) {
      // Check if favorite exists and has an id
      const hasFavorite = favorite && favorite.id;
      setLocalFavorited(hasFavorite);
      console.log('FavoriteButton - workerId:', workerId, 'favorite:', favorite, 'hasFavorite:', hasFavorite);
    }
  }, [favorite, isLoading]);

  // Only show for clients
  if (!user || user.role !== 'client') {
    return null;
  }

  // Use local state if set, otherwise check if favorite has an id
  const isFavorited = localFavorited !== null ? localFavorited : !!(favorite && favorite.id);

  const handleClick = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    console.log('FavoriteButton - handleClick:', {
      workerId,
      isFavorited,
      favorite,
      user: user?.id
    });
    
    try {
      // Optimistically update UI
      const newFavoritedState = !isFavorited;
      setLocalFavorited(newFavoritedState);
      
      await toggleFavorite.mutate({ 
        workerId, 
        isFavorited,
        onSuccess: () => {
          console.log('FavoriteButton - Toggle success, refetching...');
          // Refetch to get latest state from server
          if (refetch) {
            refetch();
          }
          
          // Call parent callback if provided
          if (onToggle) {
            onToggle(newFavoritedState);
          }
        }
      });
    } catch (err) {
      // Revert on error
      setLocalFavorited(isFavorited);
      console.error('Error toggling favorite:', err);
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
    }
  };

  if (isLoading) {
    return (
      <IconButton disabled>
        <CircularProgress size={24} />
      </IconButton>
    );
  }

  const button = (
    <IconButton
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      color={isFavorited ? 'error' : 'default'}
      sx={{
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.1)'
        }
      }}
    >
      {toggleFavorite.isPending ? (
        <CircularProgress size={24} />
      ) : isFavorited ? (
        <Favorite />
      ) : (
        <FavoriteBorder />
      )}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

export default FavoriteButton;
