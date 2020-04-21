import { Request, Response } from 'express';

/**
 * Get the home page.
 *
 * Handles HTTP GET /.
 */
export const get = (req: Request, res: Response): void => {
    res.send('Data service under construction.');
};
