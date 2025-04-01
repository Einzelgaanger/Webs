/**
 * Search Service
 * 
 * Provides search functionality across notes, assignments, and past papers
 */

import pkg from 'pg';
const { Pool } = pkg;
import { Request, Response } from 'express';
import { Session } from 'express-session';
import { db } from './db';
import { notes, assignments, pastPapers, units } from '@shared/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface CustomSession extends Session {
  isAuthenticated?: boolean;
  user?: {
    id: number;
  };
}

interface CustomRequest extends Request {
  session: CustomSession;
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  unitCode: string;
  url?: string;
}

/**
 * Record a search query
 * 
 * @param userId User ID
 * @param query Search query
 * @param resultCount Number of results found
 */
export async function recordSearchQuery(userId: number, query: string, resultCount: number): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO search_queries (user_id, query, result_count) VALUES ($1, $2, $3)',
      [userId, query, resultCount]
    );
  } catch (error) {
    console.error('Error recording search query:', error);
  }
}

/**
 * Search for content across notes, assignments, and past papers
 * 
 * @param query Search query
 * @param userId User ID
 * @param type Optional content type to filter by ('notes', 'assignments', 'papers')
 * @param unitCode Optional unit code to filter by
 * @param userId Optional user ID to filter by
 */
export async function searchContent(
  query: string,
  userId: number,
  unitCode?: string,
  type?: string
): Promise<SearchResult[]> {
  try {
    let results: SearchResult[] = [];

    // Build base conditions
    const conditions = [
      or(
        like(notes.title, `%${query}%`),
        like(assignments.title, `%${query}%`),
        like(pastPapers.title, `%${query}%`)
      )
    ];

    if (unitCode) {
      conditions.push(eq(units.unitCode, unitCode));
    }

    // Search notes if no type specified or type is 'notes'
    if (!type || type === 'notes') {
      const noteResults = await db
        .select({
          id: notes.id,
          title: notes.title,
          unitCode: notes.unitCode,
          url: notes.fileUrl
        })
        .from(notes)
        .where(and(...conditions));

      results.push(...noteResults.map(note => ({
        ...note,
        type: 'note'
      })));
    }

    // Search assignments if no type specified or type is 'assignments'
    if (!type || type === 'assignments') {
      const assignmentResults = await db
        .select({
          id: assignments.id,
          title: assignments.title,
          unitCode: assignments.unitCode
        })
        .from(assignments)
        .where(and(...conditions));

      results.push(...assignmentResults.map(assignment => ({
        ...assignment,
        type: 'assignment'
      })));
    }

    // Search past papers if no type specified or type is 'past-papers'
    if (!type || type === 'past-papers') {
      const paperResults = await db
        .select({
          id: pastPapers.id,
          title: pastPapers.title,
          unitCode: pastPapers.unitCode,
          url: pastPapers.fileUrl
        })
        .from(pastPapers)
        .where(and(...conditions));

      results.push(...paperResults.map(paper => ({
        ...paper,
        type: 'past-paper'
      })));
    }

    // Record the search
    await recordSearchQuery(userId, query, results.length);
    
    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
}

/**
 * Get search suggestions based on previous searches
 * 
 * @param query Partial search query
 * @param limit Maximum number of suggestions to return
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    const searchPattern = `${query.toLowerCase()}%`;
    
    const suggestionsQuery = `
      SELECT 
        query 
      FROM 
        search_queries 
      WHERE 
        LOWER(query) LIKE $1
      GROUP BY 
        query
      ORDER BY 
        COUNT(id) DESC
      LIMIT 5
    `;
    
    const result = await db.execute(sql.raw(suggestionsQuery, [searchPattern]));
    return result.map(row => row.query);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

/**
 * Handle search request
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleSearch(req: CustomRequest, res: Response): Promise<Response | undefined> {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not found in session' });
    }
    
    const { query, unitCode, contentType, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const results = await searchContent(
      query,
      userId,
      typeof unitCode === 'string' ? unitCode : undefined,
      typeof contentType === 'string' ? contentType : undefined
    );
    
    return res.json({ results });
  } catch (error) {
    console.error('Search handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Handle search suggestions request
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleSearchSuggestions(req: CustomRequest, res: Response): Promise<Response | undefined> {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query parameter is required' });
    }
    
    const suggestions = await getSearchSuggestions(query);
    return res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get trending searches
 * 
 * @param limit Maximum number of trending searches to return
 */
export async function getTrendingSearches(limit: number = 5): Promise<string[]> {
  try {
    const trendingQuery = `
      SELECT 
        query 
      FROM 
        search_queries 
      WHERE 
        timestamp > NOW() - INTERVAL '7 days'
      GROUP BY 
        query
      ORDER BY 
        COUNT(id) DESC
      LIMIT $1
    `;
    
    const result = await pool.query(trendingQuery, [limit]);
    return result.rows.map(row => row.query);
  } catch (error) {
    console.error('Error getting trending searches:', error);
    return [];
  }
}

/**
 * Handle trending searches request
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleTrendingSearches(req: Request, res: Response): Promise<Response | undefined> {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { limit } = req.query;
    
    const trending = await getTrendingSearches(
      typeof limit === 'string' ? parseInt(limit, 10) : 5
    );
    
    return res.json({ trending });
  } catch (error) {
    console.error('Trending searches handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}