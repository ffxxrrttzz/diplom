export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          id: number;
          user_id: string;
          post_id: number | null;
          review_id: number | null;
          thread_id: number | null;
          content: string;
          parent_comment_id: number | null;
          parent_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          post_id?: number | null;
          review_id?: number | null;
          thread_id?: number | null;
          content: string;
          parent_comment_id?: number | null;
          parent_id?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          post_id?: number | null;
          review_id?: number | null;
          thread_id?: number | null;
          content?: string;
          parent_comment_id?: number | null;
          parent_id?: number | null;
          created_at?: string;
        };
      };

      threads: {
        Row: {
          id: number;
          user_id: string;
          content_id: number | null;
          title: string;
          content: string;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
      };

      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          banner_url: string | null;
          bio: string | null;
        };
      };

      votes: {
        Row: {
          id: number;
          user_id: string;
          post_id: number | null;
          review_id: number | null;
          thread_id: number | null;
          comment_id: number | null;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          post_id?: number | null;
          review_id?: number | null;
          thread_id?: number | null;
          comment_id?: number | null;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          post_id?: number | null;
          review_id?: number | null;
          thread_id?: number | null;
          comment_id?: number | null;
          value?: number;
          created_at?: string;
        };
      };

      content: {
        Row: {
          id: number;
          external_id: number | null;
          title: string;
          original_title: string | null;
          type: 'movie' | 'series' | 'anime' | 'cartoon';
          release_year: number | null;
          description: string | null;
          poster_url: string | null;
          backdrop_url: string | null;
          rating: number | null;
          duration: number | null;
          age_rating: string | null;
          countries: string[] | null;
          genres: string[] | null;
          persons: Json | null;
          created_at: string;
          updated_at: string;
        };
      };

      seasons: {
        Row: {
          id: number;
          content_id: number;
          season_number: number;
          tmdb_id: number | null;
        };
      };

      episodes: {
        Row: {
          id: number;
          season_id: number;
          episode_number: number;
          title: string | null;
          description: string | null;
          poster_path: string | null;
          tmdb_id: number | null;
        };
      };

      reviews: {
        Row: {
          id: number;
          user_id: string;
          content_id: number | null;
          episode_id: number | null;
          title: string | null;
          text: string;
          rating: number | null;
          likes_count: number;
          created_at: string;
        };
      };
    };
  };
}