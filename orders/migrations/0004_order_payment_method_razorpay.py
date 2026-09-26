# Generated: consolidate the payment method options behind a single
# "razorpay" choice (Razorpay's own checkout screen already lets the
# customer pick UPI / card / netbanking / wallet), keeping the old
# choices around so existing orders still display correctly.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_order_payment_status_order_razorpay_order_id_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('razorpay', 'Razorpay (UPI / Card / Netbanking / Wallet)'),
                    ('cod', 'Cash on Delivery'),
                    ('upi', 'UPI'),
                    ('card', 'Credit / Debit Card'),
                    ('netbanking', 'Net Banking'),
                    ('wallet', 'Wallet'),
                ],
                default='razorpay',
                max_length=20,
            ),
        ),
    ]
