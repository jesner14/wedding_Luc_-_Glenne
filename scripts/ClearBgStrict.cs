using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ClearBgStrict
{
    public static void Run(string srcPath, string dstPath, int tol)
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

            // Sample corners for background reference
            int[][] corners = new int[][] {
                new int[]{5,5}, new int[]{w-6,5}, new int[]{5,h-6}, new int[]{w-6,h-6}
            };
            int br=0,bg=0,bb=0;
            for (int c=0;c<corners.Length;c++)
            {
                int i = corners[c][1]*stride + corners[c][0]*4;
                bb += px[i]; bg += px[i+1]; br += px[i+2];
            }
            br /= 4; bg /= 4; bb /= 4;

            bool IsBg(int x, int y)
            {
                int i = y * stride + x * 4;
                int b = px[i], gch = px[i+1], r = px[i+2], a = px[i+3];
                if (a < 8) return true;
                int dr = r - br, dg = gch - bg, db = b - bb;
                int dist2 = dr*dr + dg*dg + db*db;
                // Also require very bright (true page bg, not cream paper)
                bool bright = r >= 247 && gch >= 245 && b >= 238;
                return bright && dist2 <= tol * tol;
            }

            bool[] visited = new bool[w * h];
            var q = new Queue<int>();

            void Enqueue(int x, int y)
            {
                if (x < 0 || y < 0 || x >= w || y >= h) return;
                int idx = y * w + x;
                if (visited[idx]) return;
                visited[idx] = true;
                if (IsBg(x, y)) q.Enqueue(idx);
            }

            for (int x = 0; x < w; x++) { Enqueue(x, 0); Enqueue(x, h - 1); }
            for (int y = 0; y < h; y++) { Enqueue(0, y); Enqueue(w - 1, y); }

            while (q.Count > 0)
            {
                int idx = q.Dequeue();
                int x = idx % w;
                int y = idx / w;
                int i = y * stride + x * 4;
                px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 0;
                Enqueue(x + 1, y); Enqueue(x - 1, y); Enqueue(x, y + 1); Enqueue(x, y - 1);
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

            int pad = 6;
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
