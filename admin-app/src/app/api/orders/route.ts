import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform the data to match the admin panel interface
        const transformedOrders = orders.map(order => ({
            id: order.id.toString(),
            userId: order.userId,
            userName: order.user.name || 'Unknown',
            userEmail: order.user.email || 'N/A',
            userAvatar: order.user.avatar,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            items: order.items.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                productPrice: item.price,
                productImage: item.product.image,
                quantity: item.quantity,
                total: item.price * item.quantity,
            })),
        }));

        return NextResponse.json(transformedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
