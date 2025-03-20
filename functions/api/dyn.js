export async function onRequest(context) {
    const { DB } = context.env;
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const table = url.searchParams.get('table') || 'users'; // Nama tabel dari query parameter

    if (path === '/api/' && method === 'GET') {
        const { results } = await DB.prepare(`SELECT * FROM ${table}`).all();
        return Response.json(results);
    }
    
    if (path === '/api/' && method === 'POST') {
        try {
            const data = await request.json();
            const columns = Object.keys(data).join(', ');
            const placeholders = Object.keys(data).map(() => '?').join(', ');
            const values = Object.values(data);

            await DB.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`).bind(...values).run();
            return new Response('Data added', { status: 201, headers: corsHeaders });
        } catch (error) {
            return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
        }
    }

    if (path.startsWith('/api/') && method === 'PUT') {
        const id = url.searchParams.get('id');
        if (!id) return new Response('ID not provided', { status: 400, headers: corsHeaders });

        try {
            const data = await request.json();
            const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(data), id];

            await DB.prepare(`UPDATE ${table} SET ${updates} WHERE id = ?`).bind(...values).run();
            return new Response('Data updated', { status: 200, headers: corsHeaders });
        } catch (error) {
            return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
        }
    }

    if (path === '/api/' && method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return new Response('ID not provided', { status: 400, headers: corsHeaders });

        try {
            const result = await DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
            if (result.changes === 0) {
                return new Response('No data found to delete', { status: 404, headers: corsHeaders });
            }
            return new Response('Data deleted', { status: 200, headers: corsHeaders });
        } catch (error) {
            return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
        }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
}
