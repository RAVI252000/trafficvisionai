import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
from datetime import datetime

def send_alert_email(alert_obj):
    """
    Spawns an asynchronous background thread to compile and send the alert email,
    ensuring that database transactions and API response times remain unaffected.
    """
    thread = threading.Thread(target=_send_email_worker, args=(alert_obj,))
    thread.daemon = True
    thread.start()

def _send_email_worker(alert_obj):
    # Fetch configurations
    to_email = "ravikishoresanku@gmail.com"
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    try:
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
    except (ValueError, TypeError):
        smtp_port = 587
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", "noreply@trafficvision.ai")

    # Determine severity color representation
    severity_obj = getattr(alert_obj, "severity", "Medium")
    severity = severity_obj.value if hasattr(severity_obj, "value") else str(severity_obj)

    if severity == "Critical":
        severity_color = "#EF4444"
    elif severity == "High":
        severity_color = "#F97316"
    elif severity == "Medium":
        severity_color = "#F59E0B"
    else:
        severity_color = "#10B981"

    # HTML Email template
    title = getattr(alert_obj, "title", "New Alert Raised")
    alert_type_obj = getattr(alert_obj, "alert_type", "General Warning")
    alert_type = alert_type_obj.value if hasattr(alert_type_obj, "value") else str(alert_type_obj)
    road_name = getattr(alert_obj, "road_name", "Unknown")
    location = getattr(alert_obj, "location", "Unknown")
    description = getattr(alert_obj, "description", "")
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    subject = f"TrafficVision AI Alert: [{severity}] {title}"

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px border #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="background-color: #1e3a8a; padding: 20px; text-align: center; color: #ffffff;">
                <h2 style="margin: 0; font-size: 20px; font-weight: bold; tracking-tight: yes;">TrafficVision AI Alert Raised</h2>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p style="margin-top: 0;">A new traffic incident or predicted congestion bottleneck has been registered:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; text-align: left; font-size: 13px;">
                    <tr style="border-b: 1px border #f1f5f9;">
                        <th style="padding: 10px 12px; background-color: #f8fafc; width: 30%; font-weight: bold; border: 1px solid #e2e8f0;">Advisory Title</th>
                        <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{title}</td>
                    </tr>
                    <tr style="border-b: 1px border #f1f5f9;">
                        <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Category</th>
                        <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">{alert_type}</td>
                    </tr>
                    <tr style="border-b: 1px border #f1f5f9;">
                        <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Severity</th>
                        <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: {severity_color}; font-weight: bold;">{severity}</td>
                    </tr>
                    <tr style="border-b: 1px border #f1f5f9;">
                        <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Affected Road</th>
                        <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">{road_name}</td>
                    </tr>
                    <tr style="border-b: 1px border #f1f5f9;">
                        <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Coordinates</th>
                        <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-family: monospace;">{location}</td>
                    </tr>
                    <tr style="border-b: 1px border #f1f5f9;">
                        <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Description</th>
                        <td style="padding: 10px 12px; border: 1px solid #e2e8f0; line-height: 1.5;">{description}</td>
                    </tr>
                    <tr>
                        <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Logged Time</th>
                        <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-family: monospace;">{created_at}</td>
                    </tr>
                </table>
                
                <p style="margin-bottom: 0; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; pt-15; margin-top: 25px;">
                    This is an automated dispatch from TrafficVision AI Decision Support Portal.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    if not smtp_user:
        # Fallback to local server printing if credentials are not configured in .env
        print(f"\n======================================================\n"
              f"[EMAIL LOGGER] SMTP_USER is not configured in .env.\n"
              f"Dispatch target: {to_email}\n"
              f"Subject: {subject}\n"
              f"Body:\n{body}\n"
              f"======================================================\n")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        # SMTP SSL/TLS Login and Dispatch
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"[Email Dispatcher] Outgoing alert email successfully sent to {to_email}")
    except Exception as e:
        print(f"[Email Dispatcher Error] Failed to dispatch alert email to {to_email}: {e}")
