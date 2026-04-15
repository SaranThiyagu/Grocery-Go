import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// GET single order by ID
export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const orderId = parseInt(params.orderId);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: 'Invalid order ID' },
                { status: 400 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
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
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Transform the data
        const transformedOrder = {
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
        };

        return NextResponse.json(transformedOrder);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

// PATCH - Update order status
export async function PATCH(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const orderId = parseInt(params.orderId);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: 'Invalid order ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        // Update order status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                price: true,
                            },
                        },
                    },
                },
            },
        });

        // Send email if order is completed
        if (status === 'COMPLETED' && updatedOrder.user.email) {
            try {
                const { sendOrderCompletionEmail } = await import('@/lib/email');

                await sendOrderCompletionEmail({
                    orderId: updatedOrder.id.toString(),
                    customerName: updatedOrder.user.name || 'Customer',
                    customerEmail: updatedOrder.user.email,
                    totalAmount: updatedOrder.totalAmount,
                    items: updatedOrder.items.map(item => ({
                        productName: item.product.name,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                });

                console.log(`Order completion email sent to ${updatedOrder.user.email}`);
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            id: updatedOrder.id.toString(),
            status: updatedOrder.status,
            message: 'Order status updated successfully',
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
