# the shader's camera in Python: world point (cm) -> 640 x 360 screen px
import numpy as np
def cam(CAM, TGT, FOV):
    CAM = np.array(CAM, float); TGT = np.array(TGT, float)
    f = TGT - CAM; f /= np.linalg.norm(f); r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
    k = 0.5 / np.tan(np.radians(FOV) / 2)
    def P(p):
        d = np.array(p, float) - CAM; x, y, z = d @ r, d @ u, d @ f
        uv = np.array([x, y]) / z * k
        return np.array([uv[0] * 360 + 320, 180 - uv[1] * 360])
    return P
def feet(CAM, TGT, FOV):
    P = cam(CAM, TGT, FOV); out = []
    u0 = np.array([0.14, -0.56, -0.82]); u0 /= np.linalg.norm(u0); w0 = np.array([0, 0.82, -0.56]); w0 -= u0 * (w0 @ u0); w0 /= np.linalg.norm(w0); v0 = np.cross(w0, u0)
    for s in (1, -1):          # her right foot (screen left), then her left
        m = np.array([s, 1, 1])
        o = np.array([11.0, 12.6, 21.0]) * m; u = u0 * m; v = v0 * m; w = w0 * m
        H = o + u * 0.5 + w * 0.0; T = o + u * 21.5
        Hs, Ts = P(H), P(T); Vs = P(o + u * 12 + v * 4.6) - P(o + u * 12 - v * 4.6)
        out.append(dict(side=s, heel=Hs.tolist(), toe=Ts.tolist(), width=Vs.tolist()))
    return out
# her on her side (scene.html sideLeg): each foot from its ankle and frame; ch +1 her right foot, -1 her left. Drawn far first.
SIDE = [dict(ank=(-4.0, 15.0, 60.0), u=(0.193, -0.085, -0.978), w=(0.625, 0.779, 0.056), ch=1),
        dict(ank=(-6.0, 6.0, 61.0), u=(0.138, -0.034, -0.99), w=(0.883, 0.457, 0.107), ch=-1)]
RED = [dict(ank=(-6.0, 17.0, 19.0), u=(-0.572, -0.05, -0.818), w=(0.8, 0.187, -0.571), ch=1), SIDE[1]]
YEL = [dict(ank=(40.0, 6.2, 33.0), u=(-0.21, -0.103, -0.972), w=(0.959, 0.172, -0.226), ch=1)]
def feet_side(CAM, TGT, FOV, legs=SIDE):
    P = cam(CAM, TGT, FOV); out = []
    for L in legs:
        u = np.array(L['u'], float); u /= np.linalg.norm(u); w = np.array(L['w'], float); w -= u * (w @ u); w /= np.linalg.norm(w)
        v = np.cross(w, u) * L['ch']; o = np.array(L['ank'], float) - 3.9 * u + 5.7 * w
        H = o + u * 0.5; T = o + u * 21.5
        out.append((np.linalg.norm(o - np.array(CAM, float)), dict(side=L['ch'], heel=P(H).tolist(), toe=P(T).tolist(), width=(P(o + u * 12 + v * 4.6) - P(o + u * 12 - v * 4.6)).tolist())))
    return [f for _, f in sorted(out, key=lambda t: -t[0])]
if __name__ == '__main__':
    import sys, json
    c = [list(map(float, a.split(','))) for a in sys.argv[1:3]]; mode = sys.argv[4] if len(sys.argv) > 4 else ''
    out = feet_side(c[0], c[1], float(sys.argv[3]), RED if mode == 'red' else YEL if mode == 'yellow' else SIDE) if mode in ('side', 'red', 'yellow') else feet(c[0], c[1], float(sys.argv[3]))
    print(json.dumps(out, indent=1))
