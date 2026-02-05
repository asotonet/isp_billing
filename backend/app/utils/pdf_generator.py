from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_instalacion_pdf(instalacion, plan) -> bytes:
    """Generate installation PDF with temp client data and plan details"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#0066cc"),
        spaceAfter=30,
        alignment=1,
    )
    story.append(Paragraph("Solicitud de Instalación", title_style))
    story.append(Spacer(1, 0.3 * inch))

    # Installation info
    story.append(
        Paragraph(f"<b>Número:</b> {instalacion.numero_instalacion}", styles["Normal"])
    )
    story.append(
        Paragraph(
            f"<b>Fecha Programada:</b> {instalacion.fecha_programada.strftime('%d/%m/%Y')}",
            styles["Normal"],
        )
    )
    if instalacion.tecnico_asignado:
        story.append(
            Paragraph(f"<b>Técnico Asignado:</b> {instalacion.tecnico_asignado}", styles["Normal"])
        )
    story.append(Spacer(1, 0.2 * inch))

    # Client data table
    story.append(Paragraph("<b>DATOS DEL CLIENTE</b>", styles["Heading2"]))
    client_data = [
        [
            "Tipo ID:",
            instalacion.temp_tipo_identificacion if instalacion.temp_tipo_identificacion else "N/A",
        ],
        ["Número ID:", instalacion.temp_numero_identificacion or "N/A"],
    ]

    if instalacion.temp_nombre:
        client_data.append(["Nombre:", instalacion.temp_nombre])
    if instalacion.temp_apellido1:
        client_data.append(["Primer Apellido:", instalacion.temp_apellido1])
    if instalacion.temp_apellido2:
        client_data.append(["Segundo Apellido:", instalacion.temp_apellido2])
    if instalacion.temp_razon_social:
        client_data.append(["Razón Social:", instalacion.temp_razon_social])
    if instalacion.temp_telefono:
        client_data.append(["Teléfono:", instalacion.temp_telefono])
    if instalacion.temp_email:
        client_data.append(["Email:", instalacion.temp_email])

    # Location data
    if instalacion.temp_provincia:
        location = instalacion.temp_provincia
        if instalacion.temp_canton:
            location += f", {instalacion.temp_canton}"
        if instalacion.temp_distrito:
            location += f", {instalacion.temp_distrito}"
        client_data.append(["Ubicación:", location])

    if instalacion.temp_direccion_exacta:
        client_data.append(["Dirección:", instalacion.temp_direccion_exacta])

    client_table = Table(client_data, colWidths=[2.5 * inch, 4 * inch])
    client_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(client_table)
    story.append(Spacer(1, 0.3 * inch))

    # Plan details table
    story.append(Paragraph("<b>PLAN CONTRATADO</b>", styles["Heading2"]))
    plan_data = [
        ["Plan:", plan.nombre],
        ["Velocidad Bajada:", f"{plan.velocidad_bajada_mbps} Mbps"],
        ["Velocidad Subida:", f"{plan.velocidad_subida_mbps} Mbps"],
        ["Precio Mensual:", f"{plan.moneda} {plan.precio_mensual:,.2f}"],
    ]

    if plan.descripcion:
        plan_data.append(["Descripción:", plan.descripcion])

    plan_table = Table(plan_data, colWidths=[2.5 * inch, 4 * inch])
    plan_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(plan_table)
    story.append(Spacer(1, 0.3 * inch))

    # Notes section
    if instalacion.notas:
        story.append(Paragraph("<b>NOTAS:</b>", styles["Heading2"]))
        story.append(Paragraph(instalacion.notas, styles["Normal"]))
        story.append(Spacer(1, 0.3 * inch))

    # Signature section
    story.append(Spacer(1, 1 * inch))
    signature_data = [
        ["_________________________", "_________________________"],
        ["Firma del Cliente", "Firma del Técnico"],
        ["", ""],
        ["Fecha: _______________", "Fecha: _______________"],
    ]

    sig_table = Table(signature_data, colWidths=[3 * inch, 3 * inch])
    sig_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
            ]
        )
    )
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
