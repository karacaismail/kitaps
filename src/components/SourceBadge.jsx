import React from 'react';
import {Badge} from '@mantine/core';
import {ORIGIN_LABELS} from '../library';

export default function SourceBadge({id}) {return <Badge color={id==='kitaps'?'grape':id==='local'?'orange':id==='children'?'teal':'brand'}>{ORIGIN_LABELS[id]}</Badge>}
