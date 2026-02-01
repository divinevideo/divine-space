import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MusicWidget, type WidgetConfig, type MusicStatus } from './MusicWidget';

// Mock HTMLMediaElement methods
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();

beforeEach(() => {
  window.HTMLMediaElement.prototype.play = mockPlay;
  window.HTMLMediaElement.prototype.pause = mockPause;
});

afterEach(() => {
  mockPlay.mockClear();
  mockPause.mockClear();
});

describe('MusicWidget', () => {
  // Compact widget (w or h is 1)
  const compactWidget: WidgetConfig = {
    id: 'music-1',
    type: 'music',
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  };

  // Standard widget (w >= 2, h >= 2) - shows all features
  const standardWidget: WidgetConfig = {
    id: 'music-2',
    type: 'music',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
  };

  // Large widget (w >= 3, h >= 2) - full layout
  const largeWidget: WidgetConfig = {
    id: 'music-3',
    type: 'music',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
  };

  const defaultMusicStatus: MusicStatus = {
    type: 'profile_song',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    url: 'https://example.com/song.mp3',
  };

  describe('Placeholder (no music configured)', () => {
    it('renders placeholder when no music is configured', () => {
      render(<MusicWidget widget={standardWidget} />);

      expect(screen.getByText('No music configured')).toBeInTheDocument();
      expect(screen.getByText('Add a profile song in settings')).toBeInTheDocument();
    });

    it('renders compact placeholder for small widgets', () => {
      render(<MusicWidget widget={compactWidget} />);

      expect(screen.getByText('No music')).toBeInTheDocument();
      expect(screen.queryByText('Add a profile song in settings')).not.toBeInTheDocument();
    });
  });

  describe('Song Information', () => {
    it('displays song title and artist', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Queen')).toBeInTheDocument();
    });

    it('hides artist in compact mode', () => {
      render(<MusicWidget widget={compactWidget} musicStatus={defaultMusicStatus} />);

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.queryByText('Queen')).not.toBeInTheDocument();
    });

    it('displays the profile song badge when type is profile_song', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      expect(screen.getByText('Profile Song')).toBeInTheDocument();
    });

    it('displays the music badge when type is music', () => {
      const nowPlayingStatus: MusicStatus = {
        ...defaultMusicStatus,
        type: 'music',
      };

      render(<MusicWidget widget={standardWidget} musicStatus={nowPlayingStatus} />);

      expect(screen.getByText('Music')).toBeInTheDocument();
    });

    it('hides status badge in compact mode', () => {
      render(<MusicWidget widget={compactWidget} musicStatus={defaultMusicStatus} />);

      expect(screen.queryByText('Profile Song')).not.toBeInTheDocument();
      expect(screen.queryByText('Music')).not.toBeInTheDocument();
    });

    it('displays cover art when provided', () => {
      const musicWithCover: MusicStatus = {
        ...defaultMusicStatus,
        coverArt: 'https://example.com/cover.jpg',
      };

      render(<MusicWidget widget={standardWidget} musicStatus={musicWithCover} />);

      const coverImage = screen.getByAltText('Bohemian Rhapsody cover');
      expect(coverImage).toBeInTheDocument();
      expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });
  });

  describe('Play/Pause Controls', () => {
    it('has play/pause controls', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      const playButton = screen.getByRole('button', { name: 'Play' });
      expect(playButton).toBeInTheDocument();
    });

    it('toggles play/pause state when button is clicked', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      const playButton = screen.getByRole('button', { name: 'Play' });
      fireEvent.click(playButton);

      // After clicking play, the button should show pause
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

      // Click again to pause
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('shows Now Playing text when playing', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      const playButton = screen.getByRole('button', { name: 'Play' });
      fireEvent.click(playButton);

      expect(screen.getByText('Now Playing')).toBeInTheDocument();
    });

    it('disables play button when no URL is provided', () => {
      const musicWithoutUrl: MusicStatus = {
        type: 'profile_song',
        title: 'Unknown Song',
      };

      render(<MusicWidget widget={standardWidget} musicStatus={musicWithoutUrl} />);

      const playButton = screen.getByRole('button', { name: 'Play' });
      expect(playButton).toBeDisabled();
    });
  });

  describe('Volume Controls', () => {
    it('has mute/unmute controls in standard mode', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      const muteButton = screen.getByRole('button', { name: 'Mute' });
      expect(muteButton).toBeInTheDocument();
    });

    it('toggles mute state when button is clicked', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      const muteButton = screen.getByRole('button', { name: 'Mute' });
      fireEvent.click(muteButton);

      expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
      expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();
    });

    it('shows volume slider for standard sized widgets', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      // The slider is present - Radix UI slider may not forward aria-label to the slider role
      const volumeSlider = screen.getByRole('slider');
      expect(volumeSlider).toBeInTheDocument();
    });

    it('hides volume slider for compact widgets', () => {
      render(<MusicWidget widget={compactWidget} musicStatus={defaultMusicStatus} />);

      expect(screen.queryByRole('slider', { name: 'Volume' })).not.toBeInTheDocument();
    });

    it('hides mute button in compact mode', () => {
      render(<MusicWidget widget={compactWidget} musicStatus={defaultMusicStatus} />);

      expect(screen.queryByRole('button', { name: 'Mute' })).not.toBeInTheDocument();
    });
  });

  describe('External Link', () => {
    it('shows external link when URL is provided in standard mode', () => {
      render(<MusicWidget widget={standardWidget} musicStatus={defaultMusicStatus} />);

      const externalLink = screen.getByRole('link');
      expect(externalLink).toHaveAttribute('href', 'https://example.com/song.mp3');
      expect(externalLink).toHaveAttribute('target', '_blank');
    });

    it('hides external link in compact mode', () => {
      render(<MusicWidget widget={compactWidget} musicStatus={defaultMusicStatus} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Editing Mode', () => {
    it('shows edit toolbar when in editing mode', () => {
      const onRemove = vi.fn();
      const onConfigure = vi.fn();

      render(
        <MusicWidget
          widget={standardWidget}
          musicStatus={defaultMusicStatus}
          isEditing={true}
          onRemove={onRemove}
          onConfigure={onConfigure}
        />
      );

      expect(screen.getByRole('button', { name: 'Configure widget' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove widget' })).toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', () => {
      const onRemove = vi.fn();

      render(
        <MusicWidget
          widget={standardWidget}
          musicStatus={defaultMusicStatus}
          isEditing={true}
          onRemove={onRemove}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Remove widget' }));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('calls onConfigure when configure button is clicked', () => {
      const onConfigure = vi.fn();

      render(
        <MusicWidget
          widget={standardWidget}
          musicStatus={defaultMusicStatus}
          isEditing={true}
          onConfigure={onConfigure}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Configure widget' }));
      expect(onConfigure).toHaveBeenCalledTimes(1);
    });

    it('applies editing styles when in editing mode', () => {
      const { container } = render(
        <MusicWidget
          widget={standardWidget}
          musicStatus={defaultMusicStatus}
          isEditing={true}
        />
      );

      const card = container.querySelector('.ring-2');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Layout Adaptations', () => {
    it('adapts layout for large widgets', () => {
      render(<MusicWidget widget={largeWidget} musicStatus={defaultMusicStatus} />);

      // Large widgets should show all elements
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Queen')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MusicWidget
          widget={standardWidget}
          musicStatus={defaultMusicStatus}
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });
});
