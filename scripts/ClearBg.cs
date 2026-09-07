using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ClearBg
{
    public static void Run(string srcPath, string dstPath)
    {
        using (var src = new Bitmap(srcPath))
        using (var bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(bmp))
            {
                g.DrawImage(src, 0, 0, src.Width, src.Height);
            }

            int w = bmp.Width;
            int h = bmp.Height;
            var rect = new Rectangle(0, 0, w, h);
            var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = data.Stride;
            int bytes = Math.Abs(stride) * h;
            byte[] px = new byte[bytes];
            Marshal.Copy(data.Scan0, px, 0, bytes);

            Func<int, int, bool> isBg = (x, y) =>
            {
                int i = y * stride + x * 4;
                byte b = px[i], gch = px[i + 1], r = px[i + 2], a = px[i + 3];
                if (a < 8) return true;
                return r >= 235 && gch >= 230 && b >= 220
                    && Math.Abs(r - gch) < 25 && Math.Abs(gch - b) < 25;
            };

            bool[] visited = new bool[w * h];
            var q = new Queue<int>();
            Action<int, int> enqueue = (x, y) =>
            {
                if (x < 0 || y < 0 || x >= w || y >= h) return;
                int idx = y * w + x;
                if (visited[idx]) return;
                visited[idx] = true;
                if (isBg(x, y)) q.Enqueue(idx);
            };

            for (int x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
            for (int y = 0; y < h; y++) { enqueue(0, y); enqueue(w - 1, y); }

            while (q.Count > 0)
            {
                int idx = q.Dequeue();
                int x = idx % w;
                int y = idx / w;
                int i = y * stride + x * 4;
                px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 0;
                enqueue(x + 1, y); enqueue(x - 1, y); enqueue(x, y + 1); enqueue(x, y - 1);
            }

            int minX = w, minY = h, maxX = 0, maxY = 0;
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    int i = y * stride + x * 4;
                    if (px[i + 3] > 10)
                    {
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            Marshal.Copy(px, 0, data.Scan0, bytes);
            bmp.UnlockBits(data);

            int pad = 8;
            minX = Math.Max(0, minX - pad);
            minY = Math.Max(0, minY - pad);
            maxX = Math.Min(w - 1, maxX + pad);
            maxY = Math.Min(h - 1, maxY + pad);
            int cw = maxX - minX + 1;
            int ch = maxY - minY + 1;

            using (var cropped = bmp.Clone(new Rectangle(minX, minY, cw, ch), PixelFormat.Format32bppArgb))
            {
                cropped.Save(dstPath, ImageFormat.Png);
            }
        }
    }
}
