"""
Generates high-resolution, multi-layered icons for Tidy Tabs.
Uses Pillow to render a 512x512 master canvas with anti-aliasing and supersampling,
then downsamples with LANCZOS filtering to 128x128, 48x48, and 16x16.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def create_master_icon(size=512):
    # Master image with RGBA
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = size * 0.05
    corner_r = size * 0.22

    # 1. Background Squircle with Deep Radial/Linear Midnight Gradient
    # From top-left #1E1B4B (deep indigo) to bottom-right #0B0F19 (midnight slate)
    for y in range(int(pad), int(size - pad)):
        progress_y = (y - pad) / (size - 2 * pad)
        r = int(24 * (1 - progress_y) + 11 * progress_y)
        g = int(27 * (1 - progress_y) + 15 * progress_y)
        b = int(75 * (1 - progress_y) + 25 * progress_y)
        # Inner subtle horizontal highlight
        highlight = int(25 * math.sin(progress_y * math.pi))
        line_color = (min(255, r + highlight), min(255, g + highlight), min(255, b + highlight), 255)
        draw.line([(pad, y), (size - pad, y)], fill=line_color)

    # Mask with rounded rectangle
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=corner_r, fill=255)
    img.putalpha(mask)

    # Re-wrap for drawing shapes over the squircle
    draw = ImageDraw.Draw(img)

    # Subtle inner border for glassy depth
    border_color = (255, 255, 255, 35)
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=corner_r, outline=border_color, width=int(size * 0.015))

    # 2. Layer 1: Back Tab (Translucent Slate Card)
    # Position: top-right offset
    bx1, by1 = size * 0.32, size * 0.22
    bx2, by2 = size * 0.85, size * 0.58
    bradius = size * 0.06
    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=bradius, fill=(51, 65, 85, 180), outline=(255, 255, 255, 40), width=int(size * 0.01))

    # 3. Layer 2: Middle Tab (Vibrant Violet / Indigo Card)
    # Position: centered offset
    mx1, my1 = size * 0.22, size * 0.34
    mx2, my2 = size * 0.76, size * 0.70
    mradius = size * 0.065

    # Draw soft drop shadow for mid card
    shadow_mid = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_mid)
    s_draw.rounded_rectangle([mx1, my1 + size * 0.02, mx2, my2 + size * 0.02], radius=mradius, fill=(0, 0, 0, 140))
    shadow_mid = shadow_mid.filter(ImageFilter.GaussianBlur(size * 0.03))
    img = Image.alpha_composite(img, shadow_mid)
    draw = ImageDraw.Draw(img)

    # Fill mid tab card with rich violet-blue
    draw.rounded_rectangle([mx1, my1, mx2, my2], radius=mradius, fill=(99, 102, 241, 235), outline=(255, 255, 255, 60), width=int(size * 0.01))

    # Tab header ear on mid card
    tab_w = (mx2 - mx1) * 0.38
    draw.rounded_rectangle([mx1 + size * 0.03, my1 - size * 0.04, mx1 + size * 0.03 + tab_w, my1 + size * 0.02], radius=size * 0.03, fill=(129, 140, 248, 240))

    # 4. Layer 3: Front Active Tab (Luminous Cyan-to-Emerald Gradient)
    # Position: front-left
    fx1, fy1 = size * 0.15, size * 0.46
    fx2, fy2 = size * 0.68, size * 0.84
    fradius = size * 0.07

    # Drop shadow for active tab
    shadow_front = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sf_draw = ImageDraw.Draw(shadow_front)
    sf_draw.rounded_rectangle([fx1, fy1 + size * 0.025, fx2, fy2 + size * 0.025], radius=fradius, fill=(0, 0, 0, 180))
    shadow_front = shadow_front.filter(ImageFilter.GaussianBlur(size * 0.04))
    img = Image.alpha_composite(img, shadow_front)
    draw = ImageDraw.Draw(img)

    # Front card gradient (cyan #06B6D4 to emerald #10B981)
    card_front = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cf_draw = ImageDraw.Draw(card_front)
    for y in range(int(fy1 - size * 0.05), int(fy2 + 1)):
        prog = max(0.0, min(1.0, (y - fy1) / (fy2 - fy1 + 1e-5)))
        cr = int(6 * (1 - prog) + 16 * prog)
        cg = int(182 * (1 - prog) + 185 * prog)
        cb = int(212 * (1 - prog) + 129 * prog)
        cf_draw.line([(fx1 - size * 0.05, y), (fx2 + size * 0.05, y)], fill=(cr, cg, cb, 255))

    # Front tab shape mask including top tab notch
    fmask = Image.new('L', (size, size), 0)
    fm_draw = ImageDraw.Draw(fmask)
    # Main card
    fm_draw.rounded_rectangle([fx1, fy1, fx2, fy2], radius=fradius, fill=255)
    # Tab ear on front card
    ftab_w = (fx2 - fx1) * 0.44
    fm_draw.rounded_rectangle([fx1 + size * 0.03, fy1 - size * 0.05, fx1 + size * 0.03 + ftab_w, fy1 + size * 0.03], radius=size * 0.035, fill=255)

    card_front.putalpha(fmask)
    img = Image.alpha_composite(img, card_front)
    draw = ImageDraw.Draw(img)

    # Front tab crisp specular rim highlight
    draw.rounded_rectangle([fx1, fy1, fx2, fy2], radius=fradius, outline=(255, 255, 255, 120), width=int(size * 0.012))
    draw.rounded_rectangle([fx1 + size * 0.03, fy1 - size * 0.05, fx1 + size * 0.03 + ftab_w, fy1 + size * 0.03], radius=size * 0.035, outline=(255, 255, 255, 140), width=int(size * 0.012))

    # Mini indicator dot on front tab (active status emblem)
    dot_x, dot_y = fx1 + size * 0.09, fy1 + size * 0.07
    dot_r = size * 0.026
    draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=(255, 255, 255, 230))

    # Mini content lines on front tab (representing organized tabs)
    line_y1 = fy1 + size * 0.16
    line_y2 = fy1 + size * 0.23
    draw.rounded_rectangle([fx1 + size * 0.09, line_y1, fx2 - size * 0.12, line_y1 + size * 0.024], radius=size * 0.012, fill=(255, 255, 255, 140))
    draw.rounded_rectangle([fx1 + size * 0.09, line_y2, fx1 + (fx2 - fx1) * 0.45, line_y2 + size * 0.022], radius=size * 0.011, fill=(255, 255, 255, 100))

    return img

def main():
    os.makedirs('icons', exist_ok=True)
    master = create_master_icon(size=512)

    # 128x128
    icon128 = master.resize((128, 128), resample=Image.Resampling.LANCZOS)
    icon128.save('icons/icon128.png', 'PNG')

    # 48x48
    icon48 = master.resize((48, 48), resample=Image.Resampling.LANCZOS)
    enhancer48 = ImageEnhance.Sharpness(icon48)
    icon48 = enhancer48.enhance(1.2)
    icon48.save('icons/icon48.png', 'PNG')

    # 16x16 (boost contrast and sharpness for extension toolbar readability)
    icon16 = master.resize((16, 16), resample=Image.Resampling.LANCZOS)
    enhancer16 = ImageEnhance.Sharpness(icon16)
    icon16 = enhancer16.enhance(1.4)
    contrast16 = ImageEnhance.Contrast(icon16)
    icon16 = contrast16.enhance(1.15)
    icon16.save('icons/icon16.png', 'PNG')

    print('Bespoke icons generated: 16x16, 48x48, 128x128')

if __name__ == '__main__':
    main()
