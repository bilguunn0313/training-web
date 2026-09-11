import { NextRequest, NextResponse } from "next/server";

// Subdomain тусгаарлалт.
//
// menu.cosmotrade.mn нь ижил Next.js app руу proxy хийгддэг (NGINX). Тусдаа
// app, тусдаа build, тусдаа PM2 process хэрэггүй — ялгааг зөвхөн Host
// толгойгоор хийнэ.
//
// Хоёр чиглэлд хатуу тусгаарлана:
//   1. Kiosk subdomain ЗӨВХӨН kiosk харуулна. Ямар ч зам ирсэн /kiosk руу
//      чиглүүлнэ — таблет дээр хаяг руу гар хүрсэн ч 404 гарахгүй.
//   2. Үндсэн домэйн дээр /kiosk ХААЛТТАЙ. Эс тэгвэл нэвтрэлтгүй хуудас
//      training.cosmotrade.mn/kiosk дээр ил гарч, нэг хуудас хоёр хаягтай
//      болно.
//
// rewrite (redirect биш) учир subdomain дээрх хаяг өөрчлөгдөхгүй.

const KIOSK_HOST_PREFIX = "menu.";
const KIOSK_PATH = "/kiosk";

// Өргөтгөлтэй зам = статик файл (зураг, лого, шрифт). Эдгээрийг хөндөхгүй.
// Энэ шалгалтыг matcher-ийн оронд энд хийсэн: matcher нь МӨР бөгөөд доторх
// ташуу зураас амархан алдагддаг, regex литерал найдвартай.
const STATIC_FILE = /\.[a-zA-Z0-9]+$/;

/** Локал хөгжүүлэлтэд subdomain байхгүй тул /kiosk-ийг шууд туршиж болно. */
function isLocalHost(host: string): boolean {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  if (STATIC_FILE.test(pathname)) return NextResponse.next();

  if (host.startsWith(KIOSK_HOST_PREFIX)) {
    if (pathname === KIOSK_PATH) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = KIOSK_PATH;
    url.search = "";
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith(KIOSK_PATH) && !isLocalHost(host)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Next.js-ийн дотоод зам болон API-г хөндөхгүй. Ташуу зураас байхгүй тул
  // энэ мөр буруу escape болох эрсдэлгүй.
  matcher: ["/((?!_next/|api/).*)"],
};
