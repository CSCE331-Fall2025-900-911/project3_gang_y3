import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

async function interpretAndQuery(question: string, lang: string = 'en'): Promise<string> {
    // Normalize text: lowercase and remove accents
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const q = normalize(question);
    const isSpanish = lang.startsWith('es');

    const t = (en: string, es: string) => isSpanish ? es : en;

    try {
        if (q.includes('total sales') || (q.includes('how much') && q.includes('today')) || (isSpanish && (q.includes('ventas') || q.includes('cuanto') || q.includes('ingresos')))) {
            const result = await pool.query(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date = CURRENT_DATE'
            );
            const total = parseFloat(result.rows[0].total).toFixed(2);
            return t(`Today's total sales: $${total}`, `Ventas totales de hoy: $${total}`);
        }

        if ((q.includes('yesterday') && (q.includes('sales') || q.includes('revenue'))) || (isSpanish && q.includes('ayer') && (q.includes('ventas') || q.includes('ingresos')))) {
            const result = await pool.query(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date = CURRENT_DATE - 1'
            );
            const total = parseFloat(result.rows[0].total).toFixed(2);
            return t(`Yesterday's total sales: $${total}`, `Ventas de ayer: $${total}`);
        }

        if ((q.includes('this week') && (q.includes('sales') || q.includes('revenue'))) || (isSpanish && q.includes('semana') && (q.includes('ventas') || q.includes('ingresos')))) {
            const result = await pool.query(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date >= CURRENT_DATE - 6'
            );
            const total = parseFloat(result.rows[0].total).toFixed(2);
            return t(`This week's total sales: $${total}`, `Ventas de esta semana: $${total}`);
        }

        if (q.includes('how many orders') || q.includes('order count') || q.includes('total orders') || (isSpanish && (q.includes('cuantas ordenes') || q.includes('pedidos') || q.includes('cantidad')))) {
            if (q.includes('yesterday') || (isSpanish && q.includes('ayer'))) {
                const result = await pool.query(
                    'SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE - 1'
                );
                return t(`Yesterday's order count: ${result.rows[0].count} orders`, `Cantidad de pedidos de ayer: ${result.rows[0].count}`);
            }
            const result = await pool.query(
                'SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE'
            );
            return t(`Today's order count: ${result.rows[0].count} orders`, `Cantidad de pedidos de hoy: ${result.rows[0].count}`);
        }

        if (q.includes('best seller') || q.includes('top selling') || q.includes('most popular') || (isSpanish && (q.includes('mas vendido') || q.includes('populares') || q.includes('mejor')))) {
            const result = await pool.query(`
        SELECT m.item_name, COUNT(*) as sales
        FROM orders o,
        LATERAL (SELECT regexp_matches(o.item_link, '\\d+', 'g') AS menu_id_arr) AS ids,
        unnest(ids.menu_id_arr) AS menu_id_str
        JOIN menu m ON m.menu_item_id = menu_id_str::integer
        WHERE o.order_date = CURRENT_DATE
        GROUP BY m.item_name
        ORDER BY sales DESC
        LIMIT 1
      `);
            if (result.rows.length > 0) {
                return t(
                    `Today's best seller: ${result.rows[0].item_name} with ${result.rows[0].sales} orders`,
                    `Lo más vendido hoy: ${result.rows[0].item_name} con ${result.rows[0].sales} pedidos`
                );
            }
            return t(`No sales data available for today yet.`, `Aún no hay datos de ventas para hoy.`);
        }

        if (q.includes('low stock') || q.includes('running low') || (isSpanish && (q.includes('poco inventario') || q.includes('bajo stock') || q.includes('pocas') || q.includes('poco stock')))) {
            const result = await pool.query(
                'SELECT item_name, quantity_in_stock, unit FROM inventory WHERE quantity_in_stock < 20 ORDER BY quantity_in_stock ASC LIMIT 5'
            );
            if (result.rows.length === 0) {
                return t('All items are well stocked!', '¡Todos los artículos están bien abastecidos!');
            }
            const items = result.rows.map(r => `${r.item_name}: ${r.quantity_in_stock} ${r.unit}`).join(', ');
            return t(`Low stock items: ${items}`, `Artículos con bajo inventario: ${items}`);
        }

        if (q.includes('out of stock') || (isSpanish && (q.includes('agotado') || q.includes('sin stock')))) {
            const result = await pool.query(
                'SELECT item_name FROM inventory WHERE quantity_in_stock <= 0'
            );
            if (result.rows.length === 0) {
                return t('No items are currently out of stock!', '¡No hay artículos agotados actualmente!');
            }
            return t(`Out of stock: ${result.rows.map(r => r.item_name).join(', ')}`, `Agotado: ${result.rows.map(r => r.item_name).join(', ')}`);
        }

        if (q.includes('how many staff') || q.includes('staff count') || q.includes('employees') || (isSpanish && (q.includes('personal') || q.includes('empleados') || q.includes('trabajadores')))) {
            const result = await pool.query(
                "SELECT role, COUNT(*) as count FROM authentication WHERE role IN ('Cashier', 'Manager') GROUP BY role"
            );
            const staff = result.rows.map(r => `${r.count} ${r.role}(s)`).join(', ');
            return t(`Staff count: ${staff}`, `Conteo del personal: ${staff}`);
        }

        if ((q.includes('cash') && q.includes('card')) || (isSpanish && q.includes('efectivo') && q.includes('tarjeta'))) {
            const result = await pool.query(`
        SELECT 
          SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN 1 ELSE 0 END) as cash_count,
          SUM(CASE WHEN LOWER(payment_method) = 'card' THEN 1 ELSE 0 END) as card_count
        FROM orders WHERE order_date = CURRENT_DATE
      `);
            return t(
                `Today: ${result.rows[0].cash_count || 0} cash orders, ${result.rows[0].card_count || 0} card orders`,
                `Hoy: ${result.rows[0].cash_count || 0} pedidos en efectivo, ${result.rows[0].card_count || 0} pedidos con tarjeta`
            );
        }

        if (q.includes('void') || q.includes('voided') || (isSpanish && (q.includes('anulado') || q.includes('cancelado')))) {
            const result = await pool.query(
                "SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE AND order_status = 'Voided'"
            );
            return t(`Voided orders today: ${result.rows[0].count}`, `Pedidos anulados hoy: ${result.rows[0].count}`);
        }

        if (q.includes('average') && (q.includes('order') || q.includes('ticket')) || (isSpanish && (q.includes('promedio') || q.includes('media')))) {
            const result = await pool.query(`
        SELECT COALESCE(AVG(total_amount), 0) as avg 
        FROM orders 
        WHERE order_date = CURRENT_DATE
      `);
            const avg = parseFloat(result.rows[0].avg).toFixed(2);
            return t(`Average order value today: $${avg}`, `Valor promedio del pedido hoy: $${avg}`);
        }

        if (q.includes('menu') && (q.includes('how many') || q.includes('count')) || (isSpanish && q.includes('menu') && (q.includes('cuantos') || q.includes('cantidad')))) {
            const result = await pool.query('SELECT COUNT(*) as count FROM menu');
            return t(`Total menu items: ${result.rows[0].count}`, `Total de elementos del menú: ${result.rows[0].count}`);
        }

        return t(
            "I can help with questions about sales, orders, inventory, staff, and more. Try asking:\n• What are today's total sales?\n• How many orders today?\n• What's the best seller?\n• Any low stock items?\n• How many staff members?\n• Cash vs card breakdown?",
            "Puedo ayudar con preguntas sobre ventas, pedidos, inventario, personal y más. Intenta preguntar:\n• ¿Cuáles son las ventas totales de hoy?\n• ¿Cuántos pedidos hoy?\n• ¿Cuál es el más vendido?\n• ¿Algún artículo con poco stock?\n• ¿Cuántos miembros del personal?\n• ¿Desglose efectivo vs tarjeta?"
        );

    } catch (error) {
        console.error(error);
        return t('Sorry, I had trouble processing that question. Please try rephrasing.', 'Lo siento, tuve problemas al procesar esa pregunta. Por favor intenta reformularla.');
    }
}

export async function POST(request: Request) {
    try {
        const { question, language } = await request.json();

        if (!question || typeof question !== 'string') {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        const answer = await interpretAndQuery(question, language || 'en');
        return NextResponse.json({ answer });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
    }
}
