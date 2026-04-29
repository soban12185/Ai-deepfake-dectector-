"""
PDF Report Generation Service using ReportLab.
"""

import os
import logging
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.core.config import settings
from app.models.detection import Detection
from app.utils.file_utils import ensure_dirs

logger = logging.getLogger(__name__)
ensure_dirs([settings.REPORTS_DIR])


BRAND_DARK = colors.HexColor("#0F172A")
BRAND_ACCENT = colors.HexColor("#6366F1")
BRAND_GREEN = colors.HexColor("#22C55E")
BRAND_RED = colors.HexColor("#EF4444")
BRAND_GRAY = colors.HexColor("#94A3B8")
BRAND_LIGHT = colors.HexColor("#F1F5F9")


def generate_pdf_report(detection: Detection, username: str) -> str:
    """Generate a PDF report and return the file path."""
    report_filename = f"report_{detection.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    report_path = os.path.join(settings.REPORTS_DIR, report_filename)

    doc = SimpleDocTemplate(
        report_path,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Header
    header_style = ParagraphStyle(
        "Header", parent=styles["Normal"],
        fontSize=22, fontName="Helvetica-Bold",
        textColor=BRAND_ACCENT, alignment=TA_CENTER, spaceAfter=4,
    )
    sub_style = ParagraphStyle(
        "Sub", parent=styles["Normal"],
        fontSize=10, textColor=BRAND_GRAY, alignment=TA_CENTER, spaceAfter=16,
    )
    story.append(Paragraph("AI Deepfake Detector", header_style))
    story.append(Paragraph("Official Detection Report", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_ACCENT))
    story.append(Spacer(1, 0.3 * inch))

    # Result badge
    is_fake = detection.prediction == "FAKE"
    result_color = BRAND_RED if is_fake else BRAND_GREEN
    result_style = ParagraphStyle(
        "Result", parent=styles["Normal"],
        fontSize=28, fontName="Helvetica-Bold",
        textColor=result_color, alignment=TA_CENTER, spaceAfter=4,
    )
    conf_style = ParagraphStyle(
        "Conf", parent=styles["Normal"],
        fontSize=13, textColor=BRAND_GRAY, alignment=TA_CENTER, spaceAfter=20,
    )
    story.append(Paragraph(f"{'⚠ AI-GENERATED (FAKE)' if is_fake else '✓ AUTHENTIC (REAL)'}", result_style))
    story.append(Paragraph(f"Confidence: {round(detection.confidence * 100, 1)}%", conf_style))
    story.append(Spacer(1, 0.2 * inch))

    # Metadata table
    label_style = ParagraphStyle("Label", parent=styles["Normal"], fontSize=9, fontName="Helvetica-Bold", textColor=BRAND_DARK)
    value_style = ParagraphStyle("Value", parent=styles["Normal"], fontSize=9, textColor=BRAND_DARK)

    metadata = [
        ["Field", "Value"],
        ["Report ID", f"#{detection.id}"],
        ["Filename", detection.filename],
        ["File Type", detection.file_type.upper()],
        ["File Size", f"{round(detection.file_size / 1024, 1)} KB"],
        ["Analysis Date", detection.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")],
        ["Processing Time", f"{detection.processing_time or 'N/A'}s"],
        ["Analyzed By", username],
    ]
    t = Table(metadata, colWidths=[5 * cm, 11 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRAND_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3 * inch))

    # Explanation
    section_style = ParagraphStyle(
        "Section", parent=styles["Normal"],
        fontSize=12, fontName="Helvetica-Bold",
        textColor=BRAND_DARK, spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, textColor=BRAND_DARK, leading=16, spaceAfter=12,
    )
    story.append(Paragraph("Analysis Explanation", section_style))
    story.append(Paragraph(detection.explanation or "No explanation available.", body_style))

    # Frame results for videos
    if detection.frame_results:
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Frame-by-Frame Analysis", section_style))
        frame_data = [["Frame #", "Timestamp (s)", "Prediction", "Confidence", "Suspicious"]]
        for fr in detection.frame_results[:20]:
            frame_data.append([
                str(fr.get("frame_number", "")),
                str(fr.get("timestamp", "")),
                fr.get("prediction", ""),
                f"{round(fr.get('confidence', 0) * 100, 1)}%",
                "⚠ Yes" if fr.get("is_suspicious") else "No",
            ])
        ft = Table(frame_data, colWidths=[2.5*cm, 3.5*cm, 3.5*cm, 3.5*cm, 3.5*cm])
        ft.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_ACCENT),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRAND_LIGHT, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(ft)

    # Footer
    story.append(Spacer(1, 0.4 * inch))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_GRAY))
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=8, textColor=BRAND_GRAY, alignment=TA_CENTER, spaceBefore=6,
    )
    story.append(Paragraph(
        "This report was generated automatically by AI Deepfake Detector. "
        "Results should be used as a guide and not as sole legal evidence. "
        f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC.",
        footer_style,
    ))

    doc.build(story)
    logger.info(f"PDF report generated: {report_path}")
    return report_filename
