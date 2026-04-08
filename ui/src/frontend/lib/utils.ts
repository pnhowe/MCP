export function dateStr( d: Date | string | null | undefined ): string
{
  if ( !d ) return '';
  if ( typeof d === 'string' ) return d;
  return d.toLocaleString();
}

export function isToday( d: string | Date ): boolean
{
  const today = new Date();
  return today.toDateString() === new Date( d ).toDateString();
}

export function friendlyDate( d: string | Date ): string
{
  if ( !d ) return '';
  if ( isToday( d ) )
  {
    return 'Today at ' + new Date( d ).toLocaleTimeString();
  }
  return new Date( d ).toLocaleString();
}
