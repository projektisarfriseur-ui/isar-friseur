-- Team portraits moved from .jpg to .webp (public/team/*.webp).
update booking.staff
   set photo_url = regexp_replace(photo_url, '\.jpg$', '.webp')
 where photo_url ~ '^/team/(gulay|paula|karam|gjent|haji)\.jpg$';

update public.stylists
   set photo_url = regexp_replace(photo_url, '\.jpg$', '.webp')
 where photo_url ~ '^/team/(gulay|paula|karam|gjent|haji)\.jpg$';
