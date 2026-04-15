import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform the data to include proper image paths
        const transformedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
        }));

        return NextResponse.json(transformedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, price, image, category } = body;

        // Validation
        if (!name || !price) {
            return NextResponse.json(
                { error: 'Name and price are required' },
                { status: 400 }
            );
        }

        if (typeof price !== 'number' || price <= 0) {
            return NextResponse.json(
                { error: 'Price must be a positive number' },
                { status: 400 }
            );
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                name,
                description: description || null,
                price,
                image: image || null,
                category: category || null,
            },
        });

        return NextResponse.json({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
