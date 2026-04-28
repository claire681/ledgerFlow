import asyncio
import traceback
from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.models import User
from app.api.routes.briefing import gather_business_data, generate_briefing_with_ai
from app.services.email_service import send_email


async def check_and_send_briefings():
    """
    Runs every 15 minutes.
    Checks all users and sends briefing to anyone whose local time
    matches their chosen briefing time.
    """
    print(f"[Scheduler] Checking briefings at {datetime.utcnow().strftime('%H:%M')} UTC")

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User))
            users  = result.scalars().all()

            for user in users:
                try:
                    # Skip if briefing is disabled
                    briefing_enabled = getattr(user, "briefing_enabled", True)
                    if not briefing_enabled:
                        continue

                    # Get user preferences
                    briefing_time = getattr(user, "briefing_time", "08:00") or "08:00"
                    timezone_str  = getattr(user, "briefing_timezone", "America/Edmonton") or "America/Edmonton"

                    # Get current time in user's timezone
                    try:
                        tz       = ZoneInfo(timezone_str)
                        now_user = datetime.now(tz)
                    except Exception:
                        now_user = datetime.utcnow()

                    # Check if current hour:minute matches briefing time
                    current_hhmm  = now_user.strftime("%H:%M")
                    target_hour   = briefing_time[:5]  # e.g. "08:00"

                    # Only send if within the same hour window
                    if current_hhmm[:2] != target_hour[:2]:
                        continue

                    # Check if already sent today in user's timezone
                    last_sent = getattr(user, "last_briefing_at", None)
                    if last_sent:
                        try:
                            last_sent_user = last_sent.astimezone(tz)
                            if last_sent_user.date() == now_user.date():
                                print(f"[Scheduler] Already sent to {user.email} today — skipping")
                                continue
                        except Exception:
                            pass

                    # Generate and send briefing
                    print(f"[Scheduler] Sending briefing to {user.email}")
                    uid  = str(user.id)
                    name = getattr(user, "full_name", "") or user.email

                    data = await gather_business_data(db, uid)
                    html = await generate_briefing_with_ai(data)

                    result_send = await send_email(
                        to_email  = user.email,
                        subject   = f"📊 LedgerFlow Morning Briefing — {data['date']}",
                        body_html = html,
                        to_name   = name,
                    )

                    if result_send.get("success"):
                        # Update last_briefing_at
                        user.last_briefing_at = datetime.utcnow()
                        await db.commit()
                        print(f"[Scheduler] ✅ Briefing sent to {user.email}")
                    else:
                        print(f"[Scheduler] ❌ Failed to send to {user.email}: {result_send.get('message')}")

                except Exception as e:
                    print(f"[Scheduler] Error processing {getattr(user, 'email', 'unknown')}: {traceback.format_exc()}")
                    continue

    except Exception as e:
        print(f"[Scheduler] Critical error: {traceback.format_exc()}")


async def run_scheduler():
    """Runs the scheduler loop every 15 minutes."""
    print("[Scheduler] Started — checking every 15 minutes")
    while True:
        await check_and_send_briefings()
        await asyncio.sleep(15 * 60)  # 15 minutes