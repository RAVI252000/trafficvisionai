from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from database.database import get_db
from core.dependencies import get_current_active_user
from models.user import User
from models.report import TrafficReport
from schemas.report import ReportCreate, ReportResponse
from services.reports_service import reports_service

router = APIRouter(prefix="/api/v1/reports", tags=["Traffic Prediction Reports"])

@router.get("/traffic", response_model=Dict[str, Any])
def get_traffic_prediction_reports(
    date: Optional[str] = None,
    region: Optional[str] = None,
    road_type: Optional[str] = None,
    time_range: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get aggregated prediction insights and analytics charts data.
    Accessible by authenticated users.
    """
    try:
        return reports_service.get_report_data(
            date=date,
            region=region,
            road_type=road_type,
            time_range=time_range
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate traffic prediction report: {str(e)}"
        )

@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate and save a traffic prediction report based on filters.
    """
    try:
        # 1. Compile report summary statistics via reports_service
        report_data = reports_service.get_report_data(
            date=payload.date,
            region=payload.region,
            road_type=payload.road_type,
            time_range=payload.time_range
        )
        
        # 2. Construct filter object stored in DB
        filters_applied = {
            "date": payload.date,
            "region": payload.region,
            "road_type": payload.road_type,
            "time_range": payload.time_range
        }
        
        # 3. Create TrafficReport record
        new_report = TrafficReport(
            name=payload.name,
            report_type=payload.report_type,
            filters_applied=filters_applied,
            format=payload.format,
            summary_data=report_data,
            user_id=current_user.id
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and save report: {str(e)}"
        )

@router.get("/history", response_model=List[ReportResponse])
def get_reports_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all previously generated reports for the active user.
    """
    return db.query(TrafficReport).filter(TrafficReport.user_id == current_user.id).order_by(TrafficReport.created_at.desc()).all()

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a specific report from history.
    """
    report = db.query(TrafficReport).filter(
        TrafficReport.id == report_id,
        TrafficReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or not owned by current user."
        )
        
    try:
        db.delete(report)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete report: {str(e)}"
        )

@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve report in requested download format (CSV or HTML/PDF print layout).
    """
    report = db.query(TrafficReport).filter(
        TrafficReport.id == report_id,
        TrafficReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or not owned by current user."
        )

    # 1. Handle CSV Format
    if report.format.upper() == "CSV":
        csv_data = f"TRAFFICVISION AI REPORT: {report.name}\n"
        csv_data += f"Report Type,{report.report_type}\n"
        csv_data += f"Format,{report.format}\n"
        csv_data += f"Generated At,{report.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
        csv_data += f"Filters Applied,Date={report.filters_applied.get('date') or 'All'}, Region={report.filters_applied.get('region') or 'All'}, Road Type={report.filters_applied.get('road_type') or 'All'}, Time Range={report.filters_applied.get('time_range') or 'All'}\n\n"
        
        csv_data += "EXECUTIVE SUMMARY METRICS\n"
        sum_d = report.summary_data
        csv_data += f"Total Predictions,{sum_d.get('total_predictions', 0)}\n"
        csv_data += f"Average Traffic Volume (veh/hr),{sum_d.get('average_traffic_volume', 0)}\n"
        csv_data += f"Average Congestion Score (%),{sum_d.get('average_congestion_score', 0)}%\n"
        csv_data += f"Peak Traffic Hour,{sum_d.get('peak_hour', 'N/A')}\n"
        csv_data += f"Lowest Traffic Hour,{sum_d.get('lowest_traffic_hour', 'N/A')}\n"
        csv_data += f"Prediction Accuracy (%),{sum_d.get('prediction_accuracy', 0)}%\n\n"
        
        csv_data += "HOURLY TRAFFIC AND CONGESTION TRENDS\n"
        csv_data += "Hour,Actual Observed Volume (veh/hr),Predicted Volume (veh/hr),Congestion Score (%)\n"
        for t in sum_d.get("hourly_trends", []):
            csv_data += f"{t.get('label')},{t.get('actual')},{t.get('predicted')},{t.get('congestion')}\n"
        
        csv_data += "\nTOP CONGESTED MONITORING STATIONS\n"
        csv_data += "Road,Average Congestion Index (%),Avg Flow Volume\n"
        for rd in sum_d.get("road_trends", []):
            csv_data += f"{rd.get('road')},{rd.get('congestion')}%,{rd.get('volume')}\n"
            
        csv_data += "\nVEHICLE CLASSIFICATION SPLIT\n"
        csv_data += "Vehicle Class Category,Relative Flow Share Count\n"
        for v in sum_d.get("vehicle_split", []):
            csv_data += f"{v.get('name')},{v.get('value')}\n"
            
        filename = f"{report.name.replace(' ', '_')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    # 2. Handle HTML/PDF Printable Template
    else:
        sum_d = report.summary_data
        
        # Build HTML table of vehicle splits
        vehicle_split_rows = ""
        for v in sum_d.get("vehicle_split", []):
            vehicle_split_rows += f"""
            <tr>
              <td><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:{v.get('color')}; margin-right:8px;"></span>{v.get('name')}</td>
              <td><strong>{v.get('value'):,}</strong></td>
            </tr>
            """
            
        # Build HTML table of road bottlenecks
        road_rows = ""
        for rd in sum_d.get("road_trends", []):
            cong = rd.get('congestion', 0)
            badge_class = "badge-heavy" if cong >= 60 else "badge-mod"
            status_text = "Critical" if cong >= 85 else ("Heavy Delay" if cong >= 60 else "Moderate")
            road_rows += f"""
            <tr>
              <td><strong>{rd.get('road')}</strong></td>
              <td>{cong}%</td>
              <td>{rd.get('volume'):,} veh/hr</td>
              <td><span class="badge {badge_class}">{status_text}</span></td>
            </tr>
            """

        # Build HTML table of hourly trends
        hourly_rows = ""
        for t in sum_d.get("hourly_trends", []):
            hourly_rows += f"""
            <tr>
              <td>{t.get('label')}</td>
              <td>{t.get('actual'):,}</td>
              <td>{t.get('predicted'):,}</td>
              <td>{t.get('congestion')}%</td>
            </tr>
            """

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{report.name} - TrafficVision AI</title>
  <style>
    body {{ font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 40px; margin: 0; line-height: 1.5; }}
    .container {{ max-width: 1000px; margin: 0 auto; }}
    .report-card {{ background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 30px; margin-bottom: 24px; backdrop-filter: blur(12px); }}
    .header {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 30px; }}
    .title {{ font-size: 26px; font-weight: 800; color: #3b82f6; margin: 0; }}
    .subtitle {{ color: #94a3b8; font-size: 14px; margin-top: 4px; }}
    .meta-box {{ text-align: right; font-size: 12px; color: #94a3b8; }}
    .grid {{ display: grid; grid-template-cols: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }}
    .kpi {{ background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; text-align: center; }}
    .kpi-title {{ font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; }}
    .kpi-value {{ font-size: 20px; font-weight: 700; margin-top: 6px; color: #f8fafc; }}
    .two-col {{ display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }}
    .section-title {{ font-size: 16px; font-weight: 700; color: #f8fafc; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 12px; }}
    th {{ text-align: left; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-weight: 600; }}
    td {{ padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.03); color: #e2e8f0; }}
    .badge {{ padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; display: inline-block; }}
    .badge-heavy {{ background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }}
    .badge-mod {{ background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }}
    .badge-clear {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }}
    .toolbar {{ display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px; }}
    .btn {{ background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; text-decoration: none; }}
    .btn:hover {{ background: #1d4ed8; }}
    .btn-secondary {{ background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9; }}
    .btn-secondary:hover {{ background: rgba(255,255,255,0.1); }}
    @media print {{
      .toolbar {{ display: none; }}
      body {{ background: white; color: black; padding: 20px; }}
      .report-card {{ background: none; border: none; padding: 0; backdrop-filter: none; }}
      .kpi {{ background: none; border: 1px solid #e2e8f0; }}
      .kpi-value, .section-title, td, th {{ color: #0f172a; }}
      td {{ border-bottom: 1px solid #e2e8f0; }}
      th {{ border-bottom: 2px solid #cbd5e1; }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="toolbar">
      <button class="btn btn-secondary" onclick="window.close()">Close Preview</button>
      <button class="btn" onclick="window.print()">Print / Export PDF</button>
    </div>
    
    <div class="report-card">
      <!-- Report Header -->
      <div class="header">
        <div>
          <div class="title">{report.name}</div>
          <div class="subtitle">TrafficVision AI &bull; {report.report_type}</div>
        </div>
        <div class="meta-box">
          <div><strong>Generated:</strong> {report.created_at.strftime('%B %d, %Y %I:%M %p')}</div>
          <div><strong>Format:</strong> {report.format} Layout</div>
          <div><strong>Target Date:</strong> {report.filters_applied.get('date') or 'All'}</div>
          <div><strong>Region:</strong> {report.filters_applied.get('region') or 'All'}</div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid">
        <div class="kpi">
          <div class="kpi-title">Total Prediction Runs</div>
          <div class="kpi-value">{sum_d.get('total_predictions', 0):,}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Avg Flow (veh/hr)</div>
          <div class="kpi-value">{sum_d.get('average_traffic_volume', 0):,}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Avg Congestion Index</div>
          <div class="kpi-value">{sum_d.get('average_congestion_score', 0)}%</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Peak Flow Hour</div>
          <div class="kpi-value">{sum_d.get('peak_hour', 'N/A')}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Model R² Accuracy</div>
          <div class="kpi-value">{sum_d.get('prediction_accuracy', 0)}%</div>
        </div>
      </div>

      <!-- Two-column sections -->
      <div class="two-col">
        <!-- Bottlenecks -->
        <div class="kpi">
          <div class="section-title">Critical Road Bottlenecks</div>
          <table>
            <thead>
              <tr>
                <th>Roadway</th>
                <th>Congestion %</th>
                <th>Avg Flow</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {road_rows}
            </tbody>
          </table>
        </div>

        <!-- Vehicle Split -->
        <div class="kpi">
          <div class="section-title">Vehicle Split Analysis</div>
          <table>
            <thead>
              <tr>
                <th>Classification</th>
                <th>Observed Volume Count</th>
              </tr>
            </thead>
            <tbody>
              {vehicle_split_rows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Hourly Details -->
      <div class="kpi" style="margin-top: 20px;">
        <div class="section-title">24-Hour Forecast Flow & Congestion Curve</div>
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Hour Window</th>
                <th>Historical Baseline (veh/hr)</th>
                <th>Predicted Volume (veh/hr)</th>
                <th>Expected Congestion Saturation</th>
              </tr>
            </thead>
            <tbody>
              {hourly_rows}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  </div>
</body>
</html>
"""
        filename = f"{report.name.replace(' ', '_')}.html"
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )

